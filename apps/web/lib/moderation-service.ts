import type { ModerationSettings } from '@/sanity/lib/moderation-queries'
import {
  ModerationAction,
  ModerationSeverity,
  moderateContentRegex,
  type ModerationResult,
} from './moderation-engine'
import { applyModerationSettings } from './moderation-settings-apply'
import { moderateWithGroq } from './moderation-providers/groq-moderation'

export type ModerationSource = 'groq' | 'regex'

export interface ModerationResultWithMeta extends ModerationResult {
  source: ModerationSource
  model?: string
  latencyMs: number
}

/**
 * Attach regex source metadata and measured latency to a moderation result.
 *
 * @param result - The moderation result to augment
 * @param latencyMs - Elapsed time in milliseconds to record as `latencyMs`
 * @returns A `ModerationResultWithMeta` containing the original result fields plus `source: 'regex'` and the provided `latencyMs`
 */
function regexToResult(
  result: ModerationResult,
  latencyMs: number
): ModerationResultWithMeta {
  return { ...result, source: 'regex', latencyMs }
}

/**
 * Moderates the provided text and returns a result augmented with source, optional model, and measured latency.
 *
 * Trims the input; if the trimmed text is empty, returns an unflagged low-severity warning result. If `settings` is provided and `settings.enabled` is `false`, runs regex-based moderation only. Otherwise, attempts model-based moderation when `settings?.useModelModeration !== false` and `process.env.GROQ_API_KEY` is set; on success the result includes `source: 'groq'` and `model`. If the model call fails, the function logs the error and falls back to regex moderation unless `settings?.fallbackToRegex` is `false`, in which case the error is rethrown. All returned results include `latencyMs` measured from function start.
 *
 * @param text - The input text to moderate
 * @param settings - Optional moderation settings that can enable/disable moderation, control model usage, and configure fallback behavior
 * @returns A `ModerationResultWithMeta` describing whether the text is flagged, severity, action, reason, patterns, confidence, the `source` (`'groq'` or `'regex'`), optional `model`, and `latencyMs` (milliseconds elapsed)
 */
export async function moderateContentAsync(
  text: string,
  settings?: ModerationSettings | null
): Promise<ModerationResultWithMeta> {
  const start = Date.now()
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      isFlagged: false,
      severity: ModerationSeverity.LOW,
      action: ModerationAction.WARN,
      reason: '',
      patterns: [],
      confidence: 0,
      source: 'regex',
      latencyMs: Date.now() - start,
    }
  }

  if (settings && !settings.enabled) {
    return regexToResult(moderateContentRegex(trimmed, settings), Date.now() - start)
  }

  const useModel = settings?.useModelModeration !== false
  const fallbackToRegex = settings?.fallbackToRegex !== false

  if (useModel && process.env.GROQ_API_KEY) {
    try {
      const { analysis, model } = await moderateWithGroq(trimmed)
      const result = applyModerationSettings(analysis, settings)
      return {
        ...result,
        source: 'groq',
        model,
        latencyMs: Date.now() - start,
      }
    } catch (error) {
      console.error('GROQ moderation failed, falling back to regex:', error)
      if (!fallbackToRegex) {
        throw error
      }
    }
  }

  return regexToResult(
    moderateContentRegex(trimmed, settings),
    Date.now() - start
  )
}

/**
 * Indicates whether GROQ model moderation is available.
 *
 * @returns `true` if the `GROQ_API_KEY` environment variable is set, `false` otherwise.
 */
export function isGroqModerationAvailable(): boolean {
  return Boolean(process.env.GROQ_API_KEY)
}
