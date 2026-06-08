import type { ModerationSettings } from '@/sanity/lib/moderation-queries'

export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ModerationAction {
  WARN = 'warn',
  DELETE = 'delete',
  BAN = 'ban',
  REPORT = 'report',
}

export interface ModerationResult {
  isFlagged: boolean
  severity: ModerationSeverity
  action: ModerationAction
  reason: string
  patterns: string[]
  confidence: number
  primaryCategory?: string
}

type ContentCategory =
  | 'profanity'
  | 'hateSpeech'
  | 'threats'
  | 'spam'
  | 'personalInfo'

const INAPPROPRIATE_PATTERNS: Record<ContentCategory, RegExp[]> = {
  profanity: [
    /\b(fuck|shit|bitch|asshole|dick|pussy|cunt|cock|whore|slut)\b/gi,
    /\b(f\*ck|s\*it|b\*tch|a\*shole|d\*ck|p\*ssy|c\*nt|c\*ck|wh\*re|sl\*t)\b/gi,
  ],
  hateSpeech: [
    /\b(nigger|nigga|faggot|fag|dyke|kike|spic|chink|gook|wetback)\b/gi,
    /\b(n\*gger|n\*gga|f\*ggot|f\*g|d\*ke|k\*ke|sp\*c|ch\*nk|g\*ok|wetb\*ck)\b/gi,
  ],
  threats: [
    /\b(kill|murder|suicide|bomb|shoot|attack|hurt|harm|beat|stab)\b/gi,
    /\b(i will kill|i'll kill|going to kill|gonna kill)\b/gi,
  ],
  spam: [
    /\b(buy now|click here|free money|make money|earn cash|work from home)\b/gi,
    /\b(www\.|http:\/\/|https:\/\/)\S+/gi,
    /\b\d{10,}\b/g,
  ],
  personalInfo: [
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\d{5}-\d{4}\b/g,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ],
}

const CATEGORY_SEVERITY: Record<ContentCategory, ModerationSeverity> = {
  hateSpeech: ModerationSeverity.CRITICAL,
  threats: ModerationSeverity.HIGH,
  profanity: ModerationSeverity.MEDIUM,
  spam: ModerationSeverity.MEDIUM,
  personalInfo: ModerationSeverity.HIGH,
}

const CATEGORY_REASON: Record<ContentCategory, string> = {
  hateSpeech: 'Hate speech detected',
  threats: 'Threats or violence detected',
  profanity: 'Inappropriate language detected',
  spam: 'Spam content detected',
  personalInfo: 'Personal information detected',
}

const SEVERITY_RANK: Record<ModerationSeverity, number> = {
  [ModerationSeverity.LOW]: 0,
  [ModerationSeverity.MEDIUM]: 1,
  [ModerationSeverity.HIGH]: 2,
  [ModerationSeverity.CRITICAL]: 3,
}

const DEFAULT_ACTIONS: ModerationSettings['actions'] = {
  profanity: 'delete',
  hateSpeech: 'ban',
  threats: 'ban',
  spam: 'delete',
  personalInfo: 'delete',
}

/**
 * Determines whether a given severity meets or exceeds a configured minimum severity floor.
 *
 * @param severity - The severity to evaluate
 * @param floor - The minimum allowed severity (severity floor) to compare against
 * @returns `true` if `severity` is greater than or equal to `floor`, `false` otherwise
 */
function severityMeetsFloor(
  severity: ModerationSeverity,
  floor: ModerationSettings['severity']
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[floor as ModerationSeverity]
}

/**
 * Convert a configured per-category action value into the corresponding ModerationAction enum.
 *
 * @param action - The configured action for a content category (`'delete'`, `'ban'`, `'report'`, `'warn'`)
 * @returns The corresponding `ModerationAction` enum value (`DELETE`, `BAN`, `REPORT`, or `WARN`). Defaults to `WARN` for unrecognized inputs.
 */
function mapAction(
  action: ModerationSettings['actions'][ContentCategory]
): ModerationAction {
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
 * Selects the moderation action for a given content category using the provided settings or the built-in defaults.
 *
 * @param category - The content category to resolve an action for
 * @param settings - Optional moderation settings; when omitted or null, category actions are taken from defaults
 * @returns The resolved `ModerationAction` for the specified category
 */
function getActionForCategory(
  category: ContentCategory,
  settings?: ModerationSettings | null
): ModerationAction {
  const actions = settings?.actions ?? DEFAULT_ACTIONS
  return mapAction(actions[category])
}

/**
 * Evaluates a piece of text for inappropriate content using category regexes (profanity, hate speech, threats, spam, personal info) and heuristic signals (length, repetition, excessive caps), producing a structured moderation decision.
 *
 * @param settings - Optional moderation settings that can disable the check and override thresholds (`messageLength`, `repetitionCount`, `capsRatio`, `confidence`), severity floor (`severity`), and per-category actions (`actions`).
 * @returns A ModerationResult describing the outcome: `isFlagged` indicates whether the text was flagged; when flagged the result includes `severity`, `action`, a human-readable `reason`, the list of matched `patterns`, a `confidence` score (0–1), and an optional `primaryCategory`.
 */
export function moderateContentRegex(
  text: string,
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

  const thresholds = settings?.thresholds ?? {
    messageLength: 500,
    repetitionCount: 3,
    capsRatio: 0.7,
    confidence: 0.6,
  }
  const severityFloor = (settings?.severity ?? 'medium') as ModerationSettings['severity']

  const detectedPatterns: string[] = []
  let confidence = 0
  let severity = ModerationSeverity.LOW
  let reason = ''
  let primaryCategory: string | undefined
  let action = ModerationAction.WARN
  let hasCategoryMatch = false

  const applyDetection = (
    patternKey: string,
    detectionSeverity: ModerationSeverity,
    detectionReason: string,
    category?: ContentCategory
  ) => {
    if (detectedPatterns.includes(patternKey)) return
    detectedPatterns.push(patternKey)
    if (SEVERITY_RANK[detectionSeverity] >= SEVERITY_RANK[severity]) {
      severity = detectionSeverity
      reason = detectionReason
      if (category) {
        primaryCategory = category
        action = getActionForCategory(category, settings)
      }
    }
  }

  for (const [category, patterns] of Object.entries(INAPPROPRIATE_PATTERNS) as [
    ContentCategory,
    RegExp[],
  ][]) {
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        hasCategoryMatch = true
        confidence += matches.length * 0.25
        applyDetection(
          category,
          CATEGORY_SEVERITY[category],
          CATEGORY_REASON[category],
          category
        )
      }
    }
  }

  if (text.length > thresholds.messageLength) {
    confidence += 0.1
    applyDetection('longMessage', ModerationSeverity.MEDIUM, 'Very long message detected')
    if (!primaryCategory) {
      action = getActionForCategory('spam', settings)
    }
  }

  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  const wordCounts: Record<string, number> = {}
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  }

  const hasRepetition = Object.values(wordCounts).some(
    (count) => count > thresholds.repetitionCount
  )
  if (hasRepetition) {
    confidence += 0.15
    applyDetection('repetition', ModerationSeverity.MEDIUM, 'Excessive repetition detected')
    if (!primaryCategory) {
      action = getActionForCategory('spam', settings)
    }
  }

  const capsRatio =
    text.length > 0 ? (text.match(/[A-Z]/g) || []).length / text.length : 0
  if (capsRatio > thresholds.capsRatio && text.length > 10) {
    confidence += 0.1
    applyDetection('shouting', ModerationSeverity.MEDIUM, 'Excessive caps detected')
    if (!primaryCategory) {
      action = getActionForCategory('spam', settings)
    }
  }

  confidence = Math.min(confidence, 1)

  if (detectedPatterns.length === 0) {
    return emptyResult
  }

  if (!severityMeetsFloor(severity, severityFloor)) {
    return emptyResult
  }

  // Explicit pattern matches (profanity, hate speech, etc.) always flag.
  // Confidence threshold only applies to heuristic signals alone.
  if (!hasCategoryMatch && confidence < thresholds.confidence) {
    return emptyResult
  }

  if (hasCategoryMatch) {
    confidence = Math.max(confidence, thresholds.confidence)
  }

  return {
    isFlagged: true,
    severity,
    action,
    reason,
    patterns: detectedPatterns,
    confidence,
    primaryCategory,
  }
}

/** @deprecated Use moderateContentAsync from lib/moderation-service */
export const moderateContent = moderateContentRegex
