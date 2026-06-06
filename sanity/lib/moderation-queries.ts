import { studioReadClient } from './studio-client'

export interface ModerationStats {
  totalMessages: number
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
}

/**
 * Fetch moderation statistics
 */
export async function getModerationStats(): Promise<ModerationStats> {
  try {
    // Get total users
    const totalUsers = await studioReadClient.fetch(`count(*[_type == "author"])`)
    
    // Get banned users
    const bannedUsers = await studioReadClient.fetch(`count(*[_type == "author" && isBanned == true])`)
    
    // Get total reports
    const totalReports = await studioReadClient.fetch(`count(*[_type == "report"])`)
    
    // Get active reports
    const activeReports = await studioReadClient.fetch(`count(*[_type == "report" && status == "pending"])`)
    
    // Get total comments
    const totalComments = await studioReadClient.fetch(`count(*[_type == "comment"])`)
    
    // Get flagged comments (comments that have been reported)
    const flaggedComments = await studioReadClient.fetch(`count(*[_type == "comment" && _id in *[_type == "report" && reportedType == "comment"].reportedRef])`)
    
    // Get total startups
    const totalStartups = await studioReadClient.fetch(`count(*[_type == "startup"])`)
    
    // Get banned startups
    const bannedStartups = await studioReadClient.fetch(`count(*[_type == "startup" && isBanned == true])`)
    
    // Calculate moderation rate (percentage of content that has been moderated)
    const totalContent = totalComments + totalStartups
    const moderatedContent = flaggedComments + bannedStartups
    const moderationRate = totalContent > 0 ? (moderatedContent / totalContent) * 100 : 0
    
    // For chat messages, we'll estimate based on reports
    const totalMessages = totalReports * 10 // Estimate based on reports
    const flaggedMessages = totalReports
    const deletedMessages = Math.floor(totalReports * 0.7) // Estimate 70% of flagged messages are deleted
    
    return {
      totalMessages,
      flaggedMessages,
      deletedMessages,
      bannedUsers,
      activeReports,
      moderationRate: Math.round(moderationRate * 100) / 100,
      totalComments,
      flaggedComments,
      totalStartups,
      bannedStartups
    }
  } catch (error) {
    console.error('Error fetching moderation stats:', error)
    return {
      totalMessages: 0,
      flaggedMessages: 0,
      deletedMessages: 0,
      bannedUsers: 0,
      activeReports: 0,
      moderationRate: 0,
      totalComments: 0,
      flaggedComments: 0,
      totalStartups: 0,
      bannedStartups: 0
    }
  }
}

/**
 * Fetch recent moderation activity
 */
export async function getModerationActivity(limit: number = 20): Promise<ModerationActivity[]> {
  try {
    // Get recent reports
    const reports = await studioReadClient.fetch(`
      *[_type == "report"] | order(timestamp desc)[0...${limit}] {
        _id,
        timestamp,
        reportedType,
        reportedRef,
        reason,
        status,
        reportedBy->{_id, name, username},
        reportedItem->{_id, title, text}
      }
    `)
    
    // Get recent ban history entries
    const banHistory = await studioReadClient.fetch(`
      *[_type == "author" && defined(banHistory) && count(banHistory) > 0] {
        _id,
        name,
        username,
        "banHistory": banHistory[] {
          timestamp,
          reason,
          duration,
          strikeNumber
        }
      } | order(banHistory[-1].timestamp desc)[0...${limit}]
    `)
    
    const activities: ModerationActivity[] = []
    
    // Process reports
    reports.forEach((report: any) => {
      activities.push({
        id: report._id,
        timestamp: report.timestamp,
        type: 'report_created',
        userId: report.reportedBy?._id || 'unknown',
        userName: report.reportedBy?.name || report.reportedBy?.username || 'Unknown User',
        reason: report.reason,
        severity: report.severity || 'medium',
        itemId: report.reportedRef,
        itemType: report.reportedType
      })
    })
    
    // Process ban history
    banHistory.forEach((user: any) => {
      if (user.banHistory && user.banHistory.length > 0) {
        const latestBan = user.banHistory[user.banHistory.length - 1]
        activities.push({
          id: `${user._id}_ban_${latestBan.timestamp}`,
          timestamp: latestBan.timestamp,
          type: 'user_banned',
          userId: user._id,
          userName: user.name || user.username || 'Unknown User',
          reason: latestBan.reason,
          severity: latestBan.strikeNumber >= 3 ? 'critical' : 'high'
        })
      }
    })
    
    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching moderation activity:', error)
    return []
  }
}

/**
 * Fetch moderation settings
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
        personalInfo: settings.actions?.personalInfo ?? 'delete'
      },
      thresholds: {
        messageLength: settings.thresholds?.messageLength ?? 500,
        repetitionCount: settings.thresholds?.repetitionCount ?? 3,
        capsRatio: settings.thresholds?.capsRatio ?? 0.7,
        confidence: settings.thresholds?.confidence ?? 0.6
      },
      autoBan: {
        enabled: settings.autoBan?.enabled ?? true,
        duration: settings.autoBan?.duration ?? '24h',
        strikeThreshold: settings.autoBan?.strikeThreshold ?? 2
      }
    }
  } catch (error) {
    console.error('Error fetching moderation settings:', error)
    return null
  }
}
