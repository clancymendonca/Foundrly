/**
 * Formats an ISO- or Date-parsable timestamp as a compact "time ago" string.
 *
 * @param timestamp - A value accepted by the `Date` constructor representing the time to format
 * @returns A relative time string: `Just now` for under 1 minute, `Xm ago` for minutes, `Xh ago` for hours, or `Xd ago` for days
 */
export function formatTimeAgo(timestamp: string): string {
  const diffInMinutes = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / (1000 * 60)
  )
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

/**
 * Formats a parseable timestamp string into a localized date and short time representation.
 *
 * @param timestamp - A string accepted by the Date constructor (e.g., ISO 8601)
 * @returns A locale-formatted date and time using `dateStyle: 'medium'` and `timeStyle: 'short'`
 */
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
