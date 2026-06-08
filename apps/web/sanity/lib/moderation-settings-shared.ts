import type { SanityClient } from 'next-sanity'

import type { ModerationSettings } from './moderation-queries'

/**
 * Persist moderation settings to the Sanity dataset by updating the existing
 * `moderationSettings` document or creating one if none exists.
 *
 * The saved document will include a `lastUpdated` ISO timestamp. If
 * `settings.useModelModeration` or `settings.fallbackToRegex` are omitted, they
 * default to `true`.
 *
 * @param settings - Moderation configuration to persist (fields include `enabled`, `severity`, `actions`, `thresholds`, `autoBan`, `useModelModeration`, `fallbackToRegex`)
 * @returns `true` if the settings were successfully created or updated, `false` otherwise.
 */
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
      useModelModeration: settings.useModelModeration ?? true,
      fallbackToRegex: settings.fallbackToRegex ?? true,
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
