import { studioReadClient } from './studio-client'

export interface ModerationStats {
  moderationEvents: number
  flaggedMessages: number
  deletedMessages: number
  bannedUsers: number
  activeReports: number
  moderationRate: number
  totalComments: number
  flaggedComments: number
  totalStartups: number
  bannedStartups: number
}

export interface ModerationActivity {
  id: string
  timestamp: string
  type: 'message_deleted' | 'user_banned' | 'warning_sent' | 'report_created' | 'comment_deleted' | 'startup_banned'
  userId: string
  userName: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  itemId?: string
  itemType?: string
  source?: string
  model?: string
}

export interface ModerationSettings {
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  actions: {
    profanity: 'warn' | 'delete' | 'ban' | 'report'
    hateSpeech: 'warn' | 'delete' | 'ban' | 'report'
    threats: 'warn' | 'delete' | 'ban' | 'report'
    spam: 'warn' | 'delete' | 'ban' | 'report'
    personalInfo: 'warn' | 'delete' | 'ban' | 'report'
  }
  thresholds: {
    messageLength: number
    repetitionCount: number
    capsRatio: number
    confidence: number
  }
  autoBan: {
    enabled: boolean
    duration: '1h' | '24h' | '7d' | '365d' | 'perm'
    strikeThreshold: number
  }
  useModelModeration?: boolean
  fallbackToRegex?: boolean
}

export interface ModerationActivityFilters {
  type?: ModerationActivity['type']
  severity?: ModerationActivity['severity']
  since?: string
  limit?: number
  offset?: number
}

/**
 * Produce an ISO 8601 timestamp for the time a given number of hours in the past.
 *
 * @param hours - Number of hours before the current time
 * @returns An ISO 8601 timestamp string for the time `hours` hours ago
 */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

/**
 * Fetches aggregated moderation counters and computes the moderation rate.
 *
 * @param since - ISO timestamp string to limit event-based counts (defaults to 24 hours ago when omitted)
 * @returns An object containing:
 * - `moderationEvents`: number of moderation activity records since `since`
 * - `flaggedMessages`: number of warning or message deletion events since `since`
 * - `deletedMessages`: number of message deletion events since `since`
 * - `bannedUsers`: total count of banned authors
 * - `activeReports`: count of reports with status `"pending"`
 * - `moderationRate`: percentage of moderated content (flagged comments + banned startups) over total content (comments + startups), rounded to two decimals
 * - `totalComments`: total number of comments
 * - `flaggedComments`: number of comments referenced by reports
 * - `totalStartups`: total number of startups
 * - `bannedStartups`: total number of banned startups
 */
export async function getModerationStats(since?: string): Promise<ModerationStats> {
  const sinceTimestamp = since ?? hoursAgo(24)

  try {
    const [
      bannedUsers,
      activeReports,
      totalComments,
      flaggedComments,
      totalStartups,
      bannedStartups,
      moderationEvents,
      flaggedMessages,
      deletedMessages,
    ] = await Promise.all([
      studioReadClient.fetch(`count(*[_type == "author" && isBanned == true])`),
      studioReadClient.fetch(`count(*[_type == "report" && status == "pending"])`),
      studioReadClient.fetch(`count(*[_type == "comment"])`),
      studioReadClient.fetch(
        `count(*[_type == "comment" && _id in *[_type == "report" && reportedType == "comment"].reportedRef])`
      ),
      studioReadClient.fetch(`count(*[_type == "startup"])`),
      studioReadClient.fetch(`count(*[_type == "startup" && isBanned == true])`),
      studioReadClient.fetch(
        `count(*[_type == "moderationActivity" && timestamp >= $since])`,
        { since: sinceTimestamp }
      ),
      studioReadClient.fetch(
        `count(*[_type == "moderationActivity" && timestamp >= $since && type in ["warning_sent", "message_deleted"]])`,
        { since: sinceTimestamp }
      ),
      studioReadClient.fetch(
        `count(*[_type == "moderationActivity" && timestamp >= $since && type == "message_deleted"])`,
        { since: sinceTimestamp }
      ),
    ])

    const totalContent = totalComments + totalStartups
    const moderatedContent = flaggedComments + bannedStartups
    const moderationRate =
      totalContent > 0 ? (moderatedContent / totalContent) * 100 : 0

    return {
      moderationEvents,
      flaggedMessages,
      deletedMessages,
      bannedUsers,
      activeReports,
      moderationRate: Math.round(moderationRate * 100) / 100,
      totalComments,
      flaggedComments,
      totalStartups,
      bannedStartups,
    }
  } catch (error) {
    console.error('Error fetching moderation stats:', error)
    return {
      moderationEvents: 0,
      flaggedMessages: 0,
      deletedMessages: 0,
      bannedUsers: 0,
      activeReports: 0,
      moderationRate: 0,
      totalComments: 0,
      flaggedComments: 0,
      totalStartups: 0,
      bannedStartups: 0,
    }
  }
}

/**
 * Fetches moderation activity records filtered and paginated by the provided criteria.
 *
 * Retrieves documents from the `moderationActivity` index that match optional `type`, `severity`, and `since` filters, ordered by `timestamp` descending, and maps each document's `_id` to `id`.
 *
 * @param filters - Optional filters and pagination:
 *   - `type` — activity type to match (e.g., "message_deleted", "user_banned").
 *   - `severity` — severity level to match ("low" | "medium" | "high" | "critical").
 *   - `since` — ISO timestamp; only include activities with `timestamp >= since`.
 *   - `limit` — maximum number of items to return (default 50).
 *   - `offset` — number of items to skip for pagination (default 0).
 * @returns An array of `ModerationActivity` objects matching the filters, ordered by newest first. Returns an empty array if the query fails. */
export async function getModerationActivity(
  filters: ModerationActivityFilters = {}
): Promise<ModerationActivity[]> {
  const { type, severity, since, limit = 50, offset = 0 } = filters

  try {
    const filterParts = ['_type == "moderationActivity"']
    const params: Record<string, string | number> = { limit, offset }

    if (type) {
      filterParts.push('type == $type')
      params.type = type
    }
    if (severity) {
      filterParts.push('severity == $severity')
      params.severity = severity
    }
    if (since) {
      filterParts.push('timestamp >= $since')
      params.since = since
    }

    const filter = filterParts.join(' && ')
    const end = offset + limit

    const activities = await studioReadClient.fetch(
      `*[${filter}] | order(timestamp desc)[${offset}...${end}] {
        _id,
        type,
        timestamp,
        userId,
        userName,
        reason,
        severity,
        itemId,
        itemType,
        source,
        model
      }`,
      params
    )

    return activities.map((activity: {
      _id: string
      type: ModerationActivity['type']
      timestamp: string
      userId: string
      userName: string
      reason: string
      severity: ModerationActivity['severity']
      itemId?: string
      itemType?: string
      source?: string
      model?: string
    }) => ({
      id: activity._id,
      timestamp: activity.timestamp,
      type: activity.type,
      userId: activity.userId,
      userName: activity.userName,
      reason: activity.reason,
      severity: activity.severity,
      itemId: activity.itemId,
      itemType: activity.itemType,
      source: activity.source,
      model: activity.model,
    }))
  } catch (error) {
    console.error('Error fetching moderation activity:', error)
    return []
  }
}

/**
 * Fetches the moderation configuration from the CMS and applies sensible defaults for any missing fields.
 *
 * Reads the first `moderationSettings` document and fills in default values for `enabled`, `severity`,
 * `actions`, `thresholds`, `autoBan`, `useModelModeration`, and `fallbackToRegex` when those properties are absent.
 * If no settings document exists or an error occurs while fetching, the function returns `null`.
 *
 * @returns A `ModerationSettings` object with defaults applied for missing fields, or `null` if no document is found or on error.
 */
export async function getModerationSettings(): Promise<ModerationSettings | null> {
  try {
    const settings = await studioReadClient.fetch(`
      *[_type == "moderationSettings"][0] {
        enabled,
        severity,
        actions,
        thresholds,
        autoBan,
        useModelModeration,
        fallbackToRegex,
        lastUpdated
      }
    `)

    if (!settings) {
      return null
    }

    return {
      enabled: settings.enabled ?? true,
      severity: settings.severity ?? 'medium',
      actions: {
        profanity: settings.actions?.profanity ?? 'delete',
        hateSpeech: settings.actions?.hateSpeech ?? 'ban',
        threats: settings.actions?.threats ?? 'ban',
        spam: settings.actions?.spam ?? 'delete',
        personalInfo: settings.actions?.personalInfo ?? 'delete',
      },
      thresholds: {
        messageLength: settings.thresholds?.messageLength ?? 500,
        repetitionCount: settings.thresholds?.repetitionCount ?? 3,
        capsRatio: settings.thresholds?.capsRatio ?? 0.7,
        confidence: settings.thresholds?.confidence ?? 0.6,
      },
      autoBan: {
        enabled: settings.autoBan?.enabled ?? true,
        duration: settings.autoBan?.duration ?? '24h',
        strikeThreshold: settings.autoBan?.strikeThreshold ?? 2,
      },
      useModelModeration: settings.useModelModeration ?? true,
      fallbackToRegex: settings.fallbackToRegex ?? true,
    }
  } catch (error) {
    console.error('Error fetching moderation settings:', error)
    return null
  }
}
