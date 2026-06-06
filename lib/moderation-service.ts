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

function regexToResult(
  result: ModerationResult,
  latencyMs: number
): ModerationResultWithMeta {
  return { ...result, source: 'regex', latencyMs }
}

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

export function isGroqModerationAvailable(): boolean {
  return Boolean(process.env.GROQ_API_KEY)
}
