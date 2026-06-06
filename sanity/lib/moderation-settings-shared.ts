import type { SanityClient } from 'next-sanity'

import type { ModerationSettings } from './moderation-queries'

export async function saveModerationSettingsWithClient(
  client: SanityClient,
  settings: ModerationSettings
): Promise<boolean> {
  try {
    const existingSettings = await client.fetch<{ _id: string } | null>(
      `*[_type == "moderationSettings"][0] { _id }`
    )

    const settingsData = {
      _type: 'moderationSettings',
      enabled: settings.enabled,
      severity: settings.severity,
      actions: settings.actions,
      thresholds: settings.thresholds,
      autoBan: settings.autoBan,
      lastUpdated: new Date().toISOString(),
    }

    if (existingSettings) {
      await client.patch(existingSettings._id).set(settingsData).commit()
    } else {
      await client.create(settingsData)
    }

    return true
  } catch (error) {
    console.error('Error saving moderation settings:', error)
    return false
  }
}
