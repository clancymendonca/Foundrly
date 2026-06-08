import 'server-only'

import { ModerationAction } from '@/lib/moderation-engine'
import { moderateContentAsync, type ModerationResultWithMeta } from '@/lib/moderation-service'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { logModerationActivity } from '@/sanity/lib/moderation-mutations'

export interface ContentModerationContext {
  userId: string
  userName: string
  itemType: 'comment' | 'startup'
  itemId?: string
}

export type ContentModerationOutcome =
  | { allowed: true; warning?: string; result?: ModerationResultWithMeta }
  | { allowed: false; message: string; result: ModerationResultWithMeta }

/**
 * Moderates a piece of text using stored moderation settings, logs the moderation action, and returns whether the content is allowed.
 *
 * @param text - The user-provided text to moderate
 * @param context - Moderation context containing user and item details (`userId`, `userName`, `itemType`, optional `itemId`)
 * @returns `{ allowed: true; result?: ModerationResultWithMeta; warning?: string }` when content is allowed (optionally with a warning), or `{ allowed: false; message: string; result: ModerationResultWithMeta }` when content is disallowed
 */
export async function checkUserContentModeration(
  text: string,
  context: ContentModerationContext
): Promise<ContentModerationOutcome> {
  const settings = await getModerationSettings()
  const result = await moderateContentAsync(text, settings)

  if (!result.isFlagged) {
    return { allowed: true, result }
  }

  const meta = {
    source: result.source,
    model: result.model,
  }

  if (result.action === ModerationAction.WARN) {
    await logModerationActivity({
      type: 'warning_sent',
      userId: context.userId,
      userName: context.userName,
      reason: result.reason,
      severity: result.severity as 'low' | 'medium' | 'high' | 'critical',
      itemId: context.itemId,
      itemType: context.itemType,
      ...meta,
    })
    return { allowed: true, warning: result.reason, result }
  }

  await logModerationActivity({
    type: result.action === ModerationAction.BAN ? 'user_banned' : 'message_deleted',
    userId: context.userId,
    userName: context.userName,
    reason: result.reason,
    severity: result.severity as 'low' | 'medium' | 'high' | 'critical',
    itemId: context.itemId,
    itemType: context.itemType,
    ...meta,
  })

  return {
    allowed: false,
    message: result.reason || 'Content violates community guidelines',
    result,
  }
}
