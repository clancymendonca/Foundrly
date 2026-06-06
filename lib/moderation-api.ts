import { NextResponse } from 'next/server'
import { getModerationSettings } from '@/sanity/lib/moderation-queries'
import { moderateContentAsync, type ModerationResultWithMeta } from '@/lib/moderation-service'

/**
 * Format a moderation service result into the API response shape.
 *
 * @param result - Moderation result including metadata (flag, severity, action, reason, matched patterns, confidence, primary category, source, model, and latency)
 * @param settingsApplied - `true` if persisted moderation settings were applied to the check, `false` otherwise
 * @returns An object with `success: true`, a `result` object containing selected moderation fields (`isFlagged`, `severity`, `action`, `reason`, `patterns`, `confidence`, `primaryCategory`), and top-level `source`, `model`, `latencyMs`, and `settingsApplied` properties
 */
function formatResult(result: ModerationResultWithMeta, settingsApplied: boolean) {
  return {
    success: true,
    result: {
      isFlagged: result.isFlagged,
      severity: result.severity,
      action: result.action,
      reason: result.reason,
      patterns: result.patterns,
      confidence: result.confidence,
      primaryCategory: result.primaryCategory,
    },
    source: result.source,
    model: result.model,
    latencyMs: result.latencyMs,
    settingsApplied,
  }
}

/**
 * Run moderation on the provided text and return a normalized moderation result.
 *
 * @param content - The text to be moderated; leading and trailing whitespace will be trimmed
 * @returns An object with `success: true`, a `result` containing moderation fields (`isFlagged`, `severity`, `action`, `reason`, `patterns`, `confidence`, `primaryCategory`), and metadata (`source`, `model`, `latencyMs`, `settingsApplied`)
 */
export async function runModerationCheck(content: string) {
  const settings = await getModerationSettings()
  const result = await moderateContentAsync(content.trim(), settings)
  return formatResult(result, settings !== null)
}

/**
 * Handle a moderation check request for the supplied content.
 *
 * Validates that `content` is a non-empty string, runs the moderation check, and returns
 * an HTTP JSON response describing the result or an error.
 *
 * @param content - The value to moderate; must be a non-empty string.
 * @returns A NextResponse containing JSON:
 *          - On validation failure: status 400 with `{ error: 'content string is required' }`.
 *          - On success: status 200 with the moderation result object produced by `runModerationCheck`.
 *          - On internal failure: status 500 with `{ error: 'Failed to run moderation check' }`.
 */
export async function moderationCheckHandler(content: unknown) {
  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'content string is required' },
      { status: 400 }
    )
  }

  try {
    const response = await runModerationCheck(content)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error running moderation check:', error)
    return NextResponse.json(
      { error: 'Failed to run moderation check' },
      { status: 500 }
    )
  }
}
