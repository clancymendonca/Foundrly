import { NextResponse } from 'next/server'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { saveModerationSettings } from '@/sanity/lib/moderation-mutations'
import type { ModerationSettings } from '@/sanity/lib/moderation-queries'
import { getSession } from '@/lib/get-session';

/**
 * Fetches the current moderation settings and responds with a JSON payload.
 *
 * @returns A JSON response containing `{ success: true, settings }` on success, or `{ error: 'Failed to fetch moderation settings' }` with HTTP status `500` on failure.
 */
export async function GET() {
  try {
    const settings = await getModerationSettings()

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Error fetching moderation settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation settings' },
      { status: 500 }
    )
  }
}

/**
 * Handle POST requests to update moderation settings.
 *
 * @param request - HTTP request whose JSON body must include a `settings` object conforming to the moderation settings schema.
 * @returns An HTTP JSON response. On success the body contains `success` (boolean), the saved `settings`, and a `message`. On client errors the body contains `error` (and `details` when validation fails) with status `400` or `401`. On server failure the body contains `error` with status `500`.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    const validationErrors = validateModerationSettings(settings)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid settings', details: validationErrors },
        { status: 400 }
      )
    }

    const saved = await saveModerationSettings(settings)

    return NextResponse.json({
      success: saved,
      settings,
      message: 'Moderation settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating moderation settings:', error)
    return NextResponse.json(
      { error: 'Failed to update moderation settings' },
      { status: 500 }
    )
  }
}

const VALID_ACTIONS = ['warn', 'delete', 'ban', 'report'] as const
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
const VALID_DURATIONS = ['1h', '24h', '7d', '365d', 'perm'] as const

/**
 * Validates a partial moderation settings object and collects any schema violations.
 *
 * Performs presence and value checks for top-level fields (`enabled`, `severity`), the
 * `actions` map (expects keys: `profanity`, `hateSpeech`, `threats`, `spam`, `personalInfo`),
 * numeric `thresholds` (`messageLength`, `repetitionCount`, `capsRatio`, `confidence`), and
 * the `autoBan` object (`enabled`, `duration`, `strikeThreshold`). Also validates optional
 * boolean flags `useModelModeration` and `fallbackToRegex`.
 *
 * @param settings - A partial ModerationSettings object to validate
 * @returns An array of validation error messages; empty if `settings` passes all checks
 */
function validateModerationSettings(settings: Partial<ModerationSettings>): string[] {
  const errors: string[] = []

  if (typeof settings.enabled !== 'boolean') {
    errors.push('enabled must be a boolean')
  }

  if (!settings.severity || !VALID_SEVERITIES.includes(settings.severity)) {
    errors.push('severity must be one of: low, medium, high, critical')
  }

  if (!settings.actions || typeof settings.actions !== 'object') {
    errors.push('actions object is required')
  } else {
    for (const key of [
      'profanity',
      'hateSpeech',
      'threats',
      'spam',
      'personalInfo',
    ] as const) {
      const value = settings.actions[key]
      if (!value || !VALID_ACTIONS.includes(value)) {
        errors.push(`actions.${key} must be one of: warn, delete, ban, report`)
      }
    }
  }

  if (!settings.thresholds || typeof settings.thresholds !== 'object') {
    errors.push('thresholds object is required')
  } else {
    const { messageLength, repetitionCount, capsRatio, confidence } = settings.thresholds
    if (typeof messageLength !== 'number' || messageLength < 1) {
      errors.push('thresholds.messageLength must be a positive number')
    }
    if (typeof repetitionCount !== 'number' || repetitionCount < 1) {
      errors.push('thresholds.repetitionCount must be a positive number')
    }
    if (typeof capsRatio !== 'number' || capsRatio < 0 || capsRatio > 1) {
      errors.push('thresholds.capsRatio must be a number between 0 and 1')
    }
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      errors.push('thresholds.confidence must be a number between 0 and 1')
    }
  }

  if (!settings.autoBan || typeof settings.autoBan !== 'object') {
    errors.push('autoBan object is required')
  } else {
    if (typeof settings.autoBan.enabled !== 'boolean') {
      errors.push('autoBan.enabled must be a boolean')
    }
    if (!settings.autoBan.duration || !VALID_DURATIONS.includes(settings.autoBan.duration)) {
      errors.push('autoBan.duration must be one of: 1h, 24h, 7d, 365d, perm')
    }
    if (typeof settings.autoBan.strikeThreshold !== 'number' ||
      settings.autoBan.strikeThreshold < 1
    ) {
      errors.push('autoBan.strikeThreshold must be a positive number')
    }
  }

  if (settings.useModelModeration !== undefined && typeof settings.useModelModeration !== 'boolean') {
    errors.push('useModelModeration must be a boolean')
  }

  if (settings.fallbackToRegex !== undefined && typeof settings.fallbackToRegex !== 'boolean') {
    errors.push('fallbackToRegex must be a boolean')
  }

  return errors
}
