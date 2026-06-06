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

function activityMeta(result: ModerationResultWithMeta) {
  return {
    source: result.source,
    model: result.model,
  }
}

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
