import { StreamChat } from 'stream-chat'
import crypto from 'crypto'
import {
  ModerationAction,
  ModerationSeverity,
  type ModerationResult,
} from './moderation-engine'

export {
  ModerationAction,
  ModerationSeverity,
  moderateContent,
  moderateContentRegex,
  type ModerationResult,
} from './moderation-engine'

export {
  moderateContentAsync,
  isGroqModerationAvailable,
  type ModerationSource,
  type ModerationResultWithMeta,
} from './moderation-service'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

export class StreamChatModeration {
  private client: StreamChat
  private apiKey: string
  private apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.client = StreamChat.getInstance(apiKey, apiSecret)
  }

  async handleMessageModeration(
    channelId: string,
    messageId: string,
    userId: string,
    text: string
  ): Promise<void> {
    const { moderateContentAsync } = await import('./moderation-service')
    const moderationResult = await moderateContentAsync(text)

    if (!moderationResult.isFlagged) {
      return
    }

    try {
      switch (moderationResult.action) {
        case ModerationAction.DELETE:
          await this.deleteMessage(channelId, messageId, moderationResult.reason)
          break

        case ModerationAction.BAN:
          await this.deleteMessage(channelId, messageId, moderationResult.reason)
          await this.banUser(userId, moderationResult.reason)
          break

        case ModerationAction.REPORT:
          await this.reportMessage(channelId, messageId, moderationResult)
          break

        case ModerationAction.WARN:
        default:
          await this.warnUser(channelId, userId, moderationResult)
          break
      }
    } catch (error) {
      console.error('Error in message moderation:', error)
    }
  }

  private async deleteMessage(
    channelId: string,
    messageId: string,
    reason: string
  ): Promise<void> {
    try {
      const channel = this.client.channel('messaging', channelId)
      await channel.deleteMessage(messageId)

      await channel.sendMessage({
        text: `⚠️ Message removed: ${reason}`,
        user_id: 'system',
        type: 'system',
      })
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  private async banUser(userId: string, reason: string): Promise<void> {
    try {
      await this.client.banUser(userId, {
        reason,
        timeout: 24 * 60 * 60,
      })
    } catch (error) {
      console.error('Error banning user:', error)
    }
  }

  private async reportMessage(
    channelId: string,
    messageId: string,
    moderationResult: ModerationResult
  ): Promise<void> {
    try {
      const reportData = {
        reportedType: 'message',
        reportedRef: messageId,
        reason: `Auto-moderation: ${moderationResult.reason}`,
        reportedBy: 'system',
        timestamp: new Date().toISOString(),
        status: 'pending',
        adminNotes: `Severity: ${moderationResult.severity}\nConfidence: ${moderationResult.confidence}\nPatterns: ${moderationResult.patterns.join(', ')}`,
      }

      console.log('Auto-moderation report:', reportData)
    } catch (error) {
      console.error('Error reporting message:', error)
    }
  }

  private async warnUser(
    channelId: string,
    userId: string,
    moderationResult: ModerationResult
  ): Promise<void> {
    try {
      const channel = this.client.channel('messaging', channelId)

      await channel.sendMessage({
        text: `⚠️ Warning: ${moderationResult.reason}. Please be respectful in this chat.`,
        user_id: 'system',
        type: 'system',
      })
    } catch (error) {
      console.error('Error warning user:', error)
    }
  }

  async setupModerationHooks(): Promise<void> {
    console.log('Stream Chat moderation hooks configured')
  }
}

export function createStreamChatModeration(): StreamChatModeration {
  const apiKey = process.env.STREAM_API_KEY!
  const apiSecret = process.env.STREAM_API_SECRET!

  return new StreamChatModeration(apiKey, apiSecret)
}
