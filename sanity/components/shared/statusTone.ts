type BadgeTone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

/**
 * Maps a submission status string to a display `BadgeTone`.
 *
 * @param status - Submission status (e.g., `'new'`, `'contacted'`, `'in-discussion'`, `'interested'`, `'not-interested'`, `'closed'`)
 * @returns The `BadgeTone` to use for the provided status: `'primary'` for `'new'` and unknown statuses, `'caution'` for `'contacted'`/`'in-discussion'`, `'positive'` for `'interested'`, and `'default'` for `'not-interested'`/`'closed'`
 */
export function submissionStatusTone(status?: string): BadgeTone {
  switch (status) {
    case 'new':
      return 'primary'
    case 'contacted':
    case 'in-discussion':
      return 'caution'
    case 'interested':
      return 'positive'
    case 'not-interested':
    case 'closed':
      return 'default'
    default:
      return 'primary'
  }
}

/**
 * Map a severity level string to a badge tone used for UI display.
 *
 * @param severity - The severity level; expected values include `'critical'`, `'high'`, `'medium'`, and `'low'`
 * @returns `'critical'` for `'critical'` or `'high'`, `'caution'` for `'medium'`, `'positive'` for `'low'`, and `'default'` for any other value
 */
export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical'
    case 'medium':
      return 'caution'
    case 'low':
      return 'positive'
    default:
      return 'default'
  }
}

/**
 * Selects a badge tone appropriate for a report type.
 *
 * @param type - The report type identifier (e.g., `'user'`, `'comment'`, `'startup'`)
 * @returns `'critical'` for `'user'`, `'caution'` for `'comment'`, `'primary'` for `'startup'`, `'default'` for any other value
 */
export function reportTypeTone(type: string): BadgeTone {
  switch (type) {
    case 'user':
      return 'critical'
    case 'comment':
      return 'caution'
    case 'startup':
      return 'primary'
    default:
      return 'default'
  }
}

/**
 * Converts an activity type identifier into a human-readable label.
 *
 * @param type - Activity type string where words may be separated by underscores
 * @returns The input string with underscores replaced by spaces
 */
export function formatActivityType(type: string): string {
  return type.replace(/_/g, ' ')
}
