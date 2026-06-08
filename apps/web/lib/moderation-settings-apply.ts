import type { ModerationSettings } from '@/sanity/lib/moderation-queries'
import {
  ModerationAction,
  ModerationSeverity,
  type ModerationResult,
} from './moderation-engine'

export type ContentCategory =
  | 'profanity'
  | 'hateSpeech'
  | 'threats'
  | 'spam'
  | 'personalInfo'

const SEVERITY_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

const DEFAULT_ACTIONS: ModerationSettings['actions'] = {
  profanity: 'delete',
  hateSpeech: 'ban',
  threats: 'ban',
  spam: 'delete',
  personalInfo: 'delete',
}

export interface RawModerationAnalysis {
  isFlagged: boolean
  severity: string
  categories: string[]
  primaryCategory?: string
  reason: string
  confidence: number
}

/**
 * Map a textual action name to the corresponding ModerationAction enum value.
 *
 * @param action - Action name (expected: `"delete"`, `"ban"`, `"report"`, or `"warn"`)
 * @returns `ModerationAction.DELETE` for `"delete"`, `ModerationAction.BAN` for `"ban"`, `ModerationAction.REPORT` for `"report"`, and `ModerationAction.WARN` for `"warn"` or any unrecognized value
 */
function mapAction(action: string): ModerationAction {
  switch (action) {
    case 'delete':
      return ModerationAction.DELETE
    case 'ban':
      return ModerationAction.BAN
    case 'report':
      return ModerationAction.REPORT
    case 'warn':
    default:
      return ModerationAction.WARN
  }
}

/**
 * Convert a severity label string into the corresponding ModerationSeverity enum.
 *
 * @param severity - Severity label (e.g., "low", "medium", "high", "critical")
 * @returns The matching ModerationSeverity: `CRITICAL` for "critical", `HIGH` for "high", `MEDIUM` for "medium", and `LOW` for "low" or any unrecognized value
 */
function parseSeverity(severity: string): ModerationSeverity {
  switch (severity) {
    case 'critical':
      return ModerationSeverity.CRITICAL
    case 'high':
      return ModerationSeverity.HIGH
    case 'medium':
      return ModerationSeverity.MEDIUM
    case 'low':
    default:
      return ModerationSeverity.LOW
  }
}

/**
 * Selects the moderation action for a content category using optional settings.
 *
 * @param category - The content category to resolve (one of the `ContentCategory` values)
 * @param settings - Optional moderation settings whose `actions` map overrides defaults
 * @returns The `ModerationAction` assigned to `category` according to `settings.actions` or the defaults; `WARN` if the category is not configured
 */
function getActionForCategory(
  category: string,
  settings?: ModerationSettings | null
): ModerationAction {
  const actions = settings?.actions ?? DEFAULT_ACTIONS
  const key = category as ContentCategory
  if (key in actions) {
    return mapAction(actions[key])
  }
  return ModerationAction.WARN
}

/**
 * Converts a raw moderation analysis into a concrete ModerationResult according to optional moderation settings.
 *
 * @param raw - Incoming moderation analysis with flags, categories, severity, reason, and confidence
 * @param settings - Optional moderation settings (enable/disable, severity floor, thresholds, per-category actions); when omitted defaults are used
 * @returns A ModerationResult: either a flagged result populated with parsed severity, selected action, reason, category patterns, confidence, and primaryCategory, or a non-flagged empty result when moderation is disabled, the raw analysis is not flagged, the severity is below the configured floor, or the confidence is below the configured threshold
 */
export function applyModerationSettings(
  raw: RawModerationAnalysis,
  settings?: ModerationSettings | null
): ModerationResult {
  const emptyResult: ModerationResult = {
    isFlagged: false,
    severity: ModerationSeverity.LOW,
    action: ModerationAction.WARN,
    reason: '',
    patterns: [],
    confidence: 0,
  }

  if (settings && !settings.enabled) {
    return emptyResult
  }

  if (!raw.isFlagged) {
    return emptyResult
  }

  const thresholds = settings?.thresholds ?? {
    messageLength: 500,
    repetitionCount: 3,
    capsRatio: 0.7,
    confidence: 0.6,
  }
  const severityFloor = settings?.severity ?? 'medium'
  const severity = parseSeverity(raw.severity)

  if ((SEVERITY_RANK[severity] ?? 0) < (SEVERITY_RANK[severityFloor] ?? 1)) {
    return emptyResult
  }

  if (raw.confidence < thresholds.confidence) {
    return emptyResult
  }

  const primaryCategory = raw.primaryCategory ?? raw.categories[0]
  const action = primaryCategory
    ? getActionForCategory(primaryCategory, settings)
    : ModerationAction.WARN

  return {
    isFlagged: true,
    severity,
    action,
    reason: raw.reason,
    patterns: raw.categories,
    confidence: raw.confidence,
    primaryCategory,
  }
}
