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
