import { NextRequest, NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'
import { moderateContentAsync, verifyWebhookSignature } from '@/lib/stream-chat-moderation'
import type { ModerationResultWithMeta } from '@/lib/moderation-service'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { createBanHistoryEntry, calculateStrikeBan, getCurrentStrikeCount } from '@/sanity/lib/strike-system'
import { calculateBanEndDate } from '@/sanity/lib/moderation'
import { logModerationActivity } from '@/sanity/lib/moderation-mutations'
import type { ModerationSettings } from '@/sanity/lib/moderation-queries'

const apiKey = process.env.STREAM_API_KEY!
const apiSecret = process.env.STREAM_API_SECRET!
const webhookSecret = process.env.STREAM_WEBHOOK_SECRET!

/**
 * Extracts moderation metadata for use in activity logs and reports.
 *
 * @param result - Moderation result containing metadata fields
 * @returns An object with `source` and `model` properties from the moderation result
 */
function activityMeta(result: ModerationResultWithMeta) {
  return {
    source: result.source,
    model: result.model,
  }
}

/**
 * Handle Stream Chat webhook events: verify the webhook signature, run content moderation,
 * and apply the resulting action (delete, ban, report, or warn).
 *
 * @param request - The incoming Next.js request containing the webhook payload and `x-signature` header
 * @returns A JSON NextResponse indicating success or error. On successful moderation actions the response
 * includes `moderationResult` and `action`; on failure returns an error message with an appropriate HTTP
 * status (401 for auth issues, 400 for invalid payload, 404 if the user is not found, or 500 for internal errors).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = JSON.stringify(body)

    const signature = request.headers.get('x-signature')
    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 401 })
    }

    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { type, channel_id, message, user_id } = body

    if (type !== 'message.new') {
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    if (!message?.text || !user_id || !channel_id) {
      return NextResponse.json({ error: 'Invalid message data' }, { status: 400 })
    }

    const settings = await getModerationSettings()
    const moderationResult = await moderateContentAsync(message.text, settings)

    if (!moderationResult.isFlagged) {
      return NextResponse.json({ success: true, message: 'No moderation needed' })
    }

    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{
        _id,
        name,
        username,
        bannedUntil,
        isBanned,
        banHistory,
        strikeCount
      }`,
      { userId: user_id }
    )

    if (!user) {
      console.error('User not found for moderation:', user_id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)
    const channel = serverClient.channel('messaging', channel_id)

    switch (moderationResult.action) {
      case 'delete':
        await handleMessageDeletion(channel, message.id, moderationResult, user)
        break

      case 'ban':
        await handleUserBan(user, moderationResult, message.id, settings)
        await handleMessageDeletion(channel, message.id, moderationResult, user)
        break

      case 'report':
        await createModerationReport(user, moderationResult, message, channel_id)
        break

      case 'warn':
      default:
        await handleUserWarning(channel, user, moderationResult, channel_id)
        break
    }

    return NextResponse.json({
      success: true,
      moderationResult,
      action: moderationResult.action,
    })
  } catch (error) {
    console.error('Error in webhook moderation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Deletes a flagged message from the provided channel and records the moderation activity.
 *
 * @param channel - Server-side channel instance exposing a `deleteMessage(id, opts)` method
 * @param messageId - The ID of the message to delete
 * @param moderationResult - Moderation result and metadata (reason, severity, source, model, etc.) used for logging
 * @param user - The message author record containing `_id` and optional `name`/`username` for identification in logs
 */
async function handleMessageDeletion(
  channel: { deleteMessage: (id: string, opts?: object) => Promise<unknown> },
  messageId: string,
  moderationResult: ModerationResultWithMeta,
  user: { _id: string; name?: string; username?: string }
) {
  try {
    await channel.deleteMessage(messageId, {
      hard: true,
      user_id: 'system',
    })

    await logModerationActivity({
      type: 'message_deleted',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: moderationResult.reason,
      severity: moderationResult.severity as 'low' | 'medium' | 'high' | 'critical',
      itemId: messageId,
      itemType: 'message',
      ...activityMeta(moderationResult),
    })
  } catch (error) {
    console.error('Error deleting message:', error)
  }
}

/**
 * Applies automated ban or strike logic to a user based on a moderation result, persists ban state, and logs the moderation activity.
 *
 * Uses moderation settings (when provided) to determine whether auto-ban is enabled, the strike threshold, and default ban duration. If auto-ban is disabled or the user has not reached the configured strike threshold (and the severity is not `critical`), the function records a warning instead of banning. When a ban is applied it computes the appropriate ban duration (including permanent bans for `critical` severity), appends a ban-history entry, updates the user's ban fields in the datastore, and logs a `user_banned` activity. Errors are caught and logged; the function does not throw.
 *
 * @param user - The user document to update (must include `_id`; may include `name`, `username`, `banHistory`, and `strikeCount`)
 * @param moderationResult - The moderation outcome including `reason`, `severity`, and metadata used for activity logging
 * @param messageId - Identifier of the message that triggered moderation, used as the related item in logs
 * @param settings - Moderation settings or `null`; when present, `settings.autoBan.enabled`, `settings.autoBan.strikeThreshold`, and `settings.autoBan.duration` influence behavior
 */
async function handleUserBan(
  user: {
    _id: string
    name?: string
    username?: string
    banHistory?: unknown[]
    strikeCount?: number
  },
  moderationResult: ModerationResultWithMeta,
  messageId: string,
  settings: ModerationSettings | null
) {
  try {
    if (settings && !settings.autoBan.enabled) {
      await logModerationActivity({
        type: 'warning_sent',
        userId: user._id,
        userName: user.name || user.username || 'Unknown User',
        reason: `Ban skipped (auto-ban disabled): ${moderationResult.reason}`,
        severity: moderationResult.severity as 'low' | 'medium' | 'high' | 'critical',
        itemId: messageId,
        itemType: 'message',
        ...activityMeta(moderationResult),
      })
      return
    }

    const currentStrikes = getCurrentStrikeCount(user.banHistory || [])
    const strikeThreshold = settings?.autoBan.strikeThreshold ?? 2

    if (currentStrikes + 1 < strikeThreshold && moderationResult.severity !== 'critical') {
      await logModerationActivity({
        type: 'warning_sent',
        userId: user._id,
        userName: user.name || user.username || 'Unknown User',
        reason: `Strike ${currentStrikes + 1}/${strikeThreshold}: ${moderationResult.reason}`,
        severity: 'high',
        itemId: messageId,
        itemType: 'message',
        ...activityMeta(moderationResult),
      })
      return
    }

    const banDuration =
      moderationResult.severity === 'critical'
        ? 'perm'
        : (settings?.autoBan.duration ?? '24h')
    const strikeResult = calculateStrikeBan(currentStrikes, banDuration)
    const banEndDate = strikeResult.isPermanent
      ? null
      : calculateBanEndDate(strikeResult.banDuration as '1h' | '24h' | '7d' | '365d' | 'perm')

    const banHistoryEntry = createBanHistoryEntry(
      strikeResult.banDuration,
      `Auto-moderation: ${moderationResult.reason}`,
      undefined,
      strikeResult.strikeNumber
    )

    await writeClient
      .patch(user._id)
      .set({
        isBanned: true,
        bannedUntil: banEndDate ? banEndDate.toISOString() : null,
        strikeCount: strikeResult.strikeNumber,
        banHistory: [...(user.banHistory || []), banHistoryEntry],
      })
      .commit()

    await logModerationActivity({
      type: 'user_banned',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: strikeResult.isPermanent ? 'critical' : 'high',
      itemId: messageId,
      itemType: 'message',
      ...activityMeta(moderationResult),
    })
  } catch (error) {
    console.error('Error banning user:', error)
  }
}

/**
 * Creates a Sanity "report" document for a flagged message and logs a `report_created` moderation activity.
 *
 * The created report contains the moderation reason, detected patterns, confidence, source, optional model, original message text,
 * timestamp, and admin notes including severity and channel/message identifiers. After creation, a moderation activity entry is logged
 * that references the report and includes moderation metadata from `moderationResult`.
 *
 * @param user - The reported user object; must include `_id` and may include `name` or `username` for activity logging
 * @param moderationResult - Moderation result metadata (reason, patterns, confidence, source, model, severity) used to build the report and activity
 * @param message - The original message object containing `id` and `text` to include in the report
 * @param channelId - The channel identifier where the message was posted (used in admin notes and activity)
 */
async function createModerationReport(
  user: { _id: string; name?: string; username?: string },
  moderationResult: ModerationResultWithMeta,
  message: { id: string; text: string },
  channelId: string
) {
  try {
    const report = await writeClient.create({
      _type: 'report',
      reportedType: 'user',
      reportedRef: {
        _type: 'reference',
        _ref: user._id,
      },
      reason: `Auto-moderation: ${moderationResult.reason}\n\nDetected patterns: ${moderationResult.patterns.join(', ')}\nConfidence: ${Math.round(moderationResult.confidence * 100)}%\nSource: ${moderationResult.source}${moderationResult.model ? `\nModel: ${moderationResult.model}` : ''}\n\nMessage: "${message.text}"`,
      reportedBy: {
        _type: 'reference',
        _ref: 'system',
      },
      timestamp: new Date().toISOString(),
      status: 'pending',
      adminNotes: `Auto-generated report from Stream Chat moderation.\nSeverity: ${moderationResult.severity}\nChannel: ${channelId}\nMessage ID: ${message.id}`,
    })

    await logModerationActivity({
      type: 'report_created',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: moderationResult.severity as 'low' | 'medium' | 'high' | 'critical',
      itemId: report._id,
      itemType: 'report',
      ...activityMeta(moderationResult),
    })
  } catch (error) {
    console.error('Error creating moderation report:', error)
  }
}

/**
 * Sends a system warning message to a channel and records a corresponding moderation activity.
 *
 * @param channel - Stream channel instance used to send the system message
 * @param user - User object for whom the warning is recorded
 * @param moderationResult - Moderation result metadata describing reason, severity, and detected patterns
 * @param channelId - Identifier of the channel where the warning was issued
 */
async function handleUserWarning(
  channel: { sendMessage: (msg: object) => Promise<unknown> },
  user: { _id: string; name?: string; username?: string },
  moderationResult: ModerationResultWithMeta,
  channelId: string
) {
  try {
    await channel.sendMessage({
      text: `⚠️ Warning: ${moderationResult.reason}. Please be respectful in this chat.`,
      user_id: 'system',
      type: 'system',
    })

    await logModerationActivity({
      type: 'warning_sent',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: moderationResult.severity as 'low' | 'medium' | 'high' | 'critical',
      itemId: channelId,
      itemType: 'channel',
      ...activityMeta(moderationResult),
    })
  } catch (error) {
    console.error('Error sending warning:', error)
  }
}
