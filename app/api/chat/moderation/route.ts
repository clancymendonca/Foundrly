import { NextRequest, NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'
import { moderateContent, verifyWebhookSignature } from '@/lib/stream-chat-moderation'
import { createBanHistoryEntry, calculateStrikeBan, getCurrentStrikeCount } from '@/sanity/lib/strike-system'
import { calculateBanEndDate } from '@/sanity/lib/moderation'
import { logModerationActivity } from '@/sanity/lib/moderation-mutations'

const apiKey = process.env.STREAM_API_KEY!
const apiSecret = process.env.STREAM_API_SECRET!
const webhookSecret = process.env.STREAM_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = JSON.stringify(body)
    
    // Verify webhook signature for security
    const signature = request.headers.get('x-signature')
    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 401 })
    }

    // Verify the signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle different webhook events
    const { type, channel_id, message, user_id } = body

    // Only process new messages
    if (type !== 'message.new') {
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    if (!message?.text || !user_id || !channel_id) {
      return NextResponse.json({ error: 'Invalid message data' }, { status: 400 })
    }

    // Moderate the message content
    const moderationResult = moderateContent(message.text)

    if (!moderationResult.isFlagged) {
      return NextResponse.json({ success: true, message: 'No moderation needed' })
    }

    // Get user information from Sanity
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

    // Initialize Stream Chat server client
    const serverClient = StreamChat.getInstance(apiKey, apiSecret)
    const channel = serverClient.channel('messaging', channel_id)

    // Handle moderation based on severity and action
    switch (moderationResult.action) {
      case 'delete':
        await handleMessageDeletion(channel, message.id, moderationResult.reason)
        break

      case 'ban':
        await handleUserBan(user, moderationResult, message.id, channel_id)
        await handleMessageDeletion(channel, message.id, moderationResult.reason)
        break

      case 'report':
        await createModerationReport(user, moderationResult, message, channel_id)
        break

      case 'warn':
      default:
        await handleUserWarning(channel, user_id, moderationResult)
        break
    }

    return NextResponse.json({
      success: true,
      moderationResult,
      action: moderationResult.action
    })

  } catch (error) {
    console.error('Error in webhook moderation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleMessageDeletion(channel: any, messageId: string, reason: string) {
  try {
    await channel.deleteMessage(messageId, {
      hard: true,
      user_id: 'system'
    })
    console.log(`Message deleted: ${messageId} - Reason: ${reason}`)
    
    // Log moderation activity
    await logModerationActivity({
      type: 'message_deleted',
      userId: 'unknown', // We don't have user info in this context
      userName: 'Unknown User',
      reason: reason,
      severity: 'medium',
      itemId: messageId,
      itemType: 'message'
    })
  } catch (error) {
    console.error('Error deleting message:', error)
  }
}

async function handleUserBan(
  user: any, 
  moderationResult: any, 
  messageId: string, 
  channelId: string
) {
  try {
    // Calculate current strike count
    const currentStrikes = getCurrentStrikeCount(user.banHistory || [])
    
    // Determine ban duration based on strike system
    const banDuration = moderationResult.severity === 'critical' ? 'perm' : '24h'
    const strikeResult = calculateStrikeBan(currentStrikes, banDuration)
    
    // Calculate ban end date
    const banEndDate = strikeResult.isPermanent ? null : calculateBanEndDate(strikeResult.banDuration as any)
    
    // Create ban history entry
    const banHistoryEntry = createBanHistoryEntry(
      strikeResult.banDuration,
      `Auto-moderation: ${moderationResult.reason}`,
      undefined, // No report ID for auto-moderation
      strikeResult.strikeNumber
    )

    // Update user with ban
    await writeClient
      .patch(user._id)
      .set({
        isBanned: true,
        bannedUntil: banEndDate ? banEndDate.toISOString() : null,
        strikeCount: strikeResult.strikeNumber,
        banHistory: [
          ...(user.banHistory || []),
          banHistoryEntry
        ]
      })
      .commit()

    console.log(`User banned: ${user._id} - Duration: ${strikeResult.banDuration} - Reason: ${moderationResult.reason}`)
    
    // Log moderation activity
    await logModerationActivity({
      type: 'user_banned',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: strikeResult.isPermanent ? 'critical' : 'high',
      itemId: messageId,
      itemType: 'message'
    })
  } catch (error) {
    console.error('Error banning user:', error)
  }
}

async function createModerationReport(
  user: any, 
  moderationResult: any, 
  message: any, 
  channelId: string
) {
  try {
    // Create auto-moderation report in Sanity
    const report = await writeClient.create({
      _type: 'report',
      reportedType: 'user',
      reportedRef: {
        _type: 'reference',
        _ref: user._id,
      },
      reason: `Auto-moderation: ${moderationResult.reason}\n\nDetected patterns: ${moderationResult.patterns.join(', ')}\nConfidence: ${Math.round(moderationResult.confidence * 100)}%\n\nMessage: "${message.text}"`,
      reportedBy: {
        _type: 'reference',
        _ref: 'system', // System-generated report
      },
      timestamp: new Date().toISOString(),
      status: 'pending',
      adminNotes: `Auto-generated report from Stream Chat moderation.\nSeverity: ${moderationResult.severity}\nChannel: ${channelId}\nMessage ID: ${message.id}`
    })

    console.log(`Auto-moderation report created: ${report._id}`)
    
    // Log moderation activity
    await logModerationActivity({
      type: 'report_created',
      userId: user._id,
      userName: user.name || user.username || 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: moderationResult.severity,
      itemId: report._id,
      itemType: 'report'
    })
  } catch (error) {
    console.error('Error creating moderation report:', error)
  }
}

async function handleUserWarning(channel: any, userId: string, moderationResult: any) {
  try {
    // Send warning message to the channel
    await channel.sendMessage({
      text: `⚠️ Warning: ${moderationResult.reason}. Please be respectful in this chat.`,
      user_id: 'system',
      type: 'system',
    })
    console.log(`Warning sent to user: ${userId}`)
    
    // Log moderation activity
    await logModerationActivity({
      type: 'warning_sent',
      userId: userId,
      userName: 'Unknown User',
      reason: `Auto-moderation: ${moderationResult.reason}`,
      severity: moderationResult.severity,
      itemId: channelId,
      itemType: 'channel'
    })
  } catch (error) {
    console.error('Error sending warning:', error)
  }
} 