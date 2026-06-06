import 'server-only'

import { writeClient } from './write-client'
import type { ModerationActivity, ModerationSettings } from './moderation-queries'
import { saveModerationSettingsWithClient } from './moderation-settings-shared'

export async function saveModerationSettings(
  settings: ModerationSettings
): Promise<boolean> {
  return saveModerationSettingsWithClient(writeClient, settings)
}

/**
 * Persist a moderation activity record to the data store.
 *
 * @param activity - Moderation activity details (omitting `id` and `timestamp`); a `timestamp` will be added before persisting.
 * @returns `true` if the activity was written successfully, `false` otherwise.
 */
export async function logModerationActivity(
  activity: Omit<ModerationActivity, 'id' | 'timestamp'>
): Promise<boolean> {
  try {
    const activityData = {
      _type: 'moderationActivity',
      type: activity.type,
      userId: activity.userId,
      userName: activity.userName,
      reason: activity.reason,
      severity: activity.severity,
      itemId: activity.itemId,
      itemType: activity.itemType,
      source: activity.source,
      model: activity.model,
      timestamp: new Date().toISOString(),
    }

    await writeClient.create(activityData)
    return true
  } catch (error) {
    console.error('Error logging moderation activity:', error)
    return false
  }
}
