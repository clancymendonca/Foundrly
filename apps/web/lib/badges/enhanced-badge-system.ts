/** Canonical enhanced badge system (primary API for badges UI and recalculation). */
import {
  calculateTrackProgress,
  sortBadgeTracks,
  TIER_ORDER,
  type BadgeLevel,
  type BadgeTier,
  type LeveledBadge,
} from "@foundrly/shared/badges";
import { client } from '@/sanity/lib/client';
import { badgeReadClient } from '@/sanity/lib/badge-read-client';
import { writeClient } from '@/sanity/lib/write-client';

export {
  RARITY_LEVELS,
  TIER_LEVELS,
  TIER_ORDER,
  TIER_LIST,
  calculateTrackProgress,
  sortBadgeTracks,
  type BadgeLevel,
  type BadgeRarity,
  type BadgeTier,
  type LeveledBadge,
} from "@foundrly/shared/badges";

// Extended metrics for comprehensive tracking
export const EXTENDED_METRICS = {
  // Content Creation
  startups_created: 'startup',
  comments_posted: 'comment',
  replies_posted: 'reply',
  edits_made: 'edit',
  
  // Engagement
  likes_received: 'like',
  dislikes_received: 'dislike',
  views_received: 'view',
  shares_made: 'share',
  
  // Social
  followers_gained: 'follower',
  users_followed: 'following',
  messages_sent: 'message',
  chat_channels_created: 'chat',
  
  // Community
  reports_submitted: 'report',
  moderations_helped: 'moderation',
  events_attended: 'event',
  feedback_provided: 'feedback',
  
  // Time-based
  days_active: 'time',
  hours_spent: 'time',
  consecutive_days: 'streak',
  peak_activity_hours: 'time',
  
  // Quality
  content_quality_score: 'score',
  community_rating: 'rating',
  helpfulness_score: 'score',
  innovation_index: 'score',
  
  // Special
  first_mover_actions: 'special',
  trend_setting_content: 'special',
  viral_moments: 'special',
  collaboration_projects: 'special'
};

// Enhanced badge criteria interface
export interface EnhancedBadgeCriteria {
  type: 'count' | 'streak' | 'date' | 'combination' | 'quality' | 'time';
  timeframe: string;
}

// Leveled badge track (one Sanity doc per metric)
export interface EnhancedBadge {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  metric: string;
  criteria: EnhancedBadgeCriteria;
  levels: BadgeLevel[];
  isActive: boolean;
  customStyles?: {
    gradient?: boolean;
    animation?: string;
    glow?: boolean;
    shadow?: string;
  };
}

// Advanced timeframe calculations
export class TimeframeCalculator {
  static calculateTimeframe(timeframe: string, customDate?: Date): { start: Date; end: Date } {
    const now = customDate || new Date();
    
    switch (timeframe) {
      case 'rolling_24h':
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'rolling_7d':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'rolling_30d':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'calendar_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return {
          start: startOfWeek,
          end: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
        };
      
      case 'calendar_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      
      case 'seasonal':
        return this.getSeasonalTimeframe(now);
      
      case 'daily':
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'weekly':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'monthly':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        };
      
      case 'yearly':
        return {
          start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          end: now
        };
      
      default:
        return { start: new Date(0), end: now };
    }
  }

  private static getSeasonalTimeframe(date: Date): { start: Date; end: Date } {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (month >= 2 && month <= 4) { // Spring
      return {
        start: new Date(year, 2, 1),
        end: new Date(year, 4, 31)
      };
    } else if (month >= 5 && month <= 7) { // Summer
      return {
        start: new Date(year, 5, 1),
        end: new Date(year, 7, 31)
      };
    } else if (month >= 8 && month <= 10) { // Fall
      return {
        start: new Date(year, 8, 1),
        end: new Date(year, 10, 31)
      };
    } else { // Winter
      return {
        start: new Date(year, 11, 1),
        end: new Date(year + 1, 1, 28)
      };
    }
  }
}

// Enhanced streak tracking
export class StreakTracker {
  private static instance: StreakTracker;
  private userStreaks: Map<string, number> = new Map();

  static getInstance(): StreakTracker {
    if (!StreakTracker.instance) {
      StreakTracker.instance = new StreakTracker();
    }
    return StreakTracker.instance;
  }

  async checkStreakBadge(userId: string, action: string, timeframe: string): Promise<{ currentStreak: number; shouldAward: boolean }> {
    const streakKey = `${userId}_${action}_${timeframe}`;
    const currentStreak = this.userStreaks.get(streakKey) || 0;
    
    let shouldAward = false;
    let newStreak = currentStreak;
    
    switch (timeframe) {
      case 'daily':
        const dailyResult = await this.checkDailyStreak(userId, action, currentStreak);
        newStreak = dailyResult.currentStreak;
        shouldAward = dailyResult.shouldAward;
        break;
      case 'weekly':
        const weeklyResult = await this.checkWeeklyStreak(userId, action, currentStreak);
        newStreak = weeklyResult.currentStreak;
        shouldAward = weeklyResult.shouldAward;
        break;
      case 'monthly':
        const monthlyResult = await this.checkMonthlyStreak(userId, action, currentStreak);
        newStreak = monthlyResult.currentStreak;
        shouldAward = monthlyResult.shouldAward;
        break;
      default:
        newStreak = currentStreak;
        shouldAward = false;
    }
    
    this.userStreaks.set(streakKey, newStreak);
    return { currentStreak: newStreak, shouldAward };
  }

  private async checkDailyStreak(userId: string, action: string, currentStreak: number): Promise<{ currentStreak: number; shouldAward: boolean }> {
    const lastAction = await this.getLastActionDate(userId, action);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (lastAction && this.isSameDay(lastAction, yesterday)) {
      // Continue streak
      return { currentStreak: currentStreak + 1, shouldAward: false };
    } else if (lastAction && this.isSameDay(lastAction, today)) {
      // Already done today
      return { currentStreak: currentStreak, shouldAward: false };
    } else {
      // Break in streak, reset
      return { currentStreak: 1, shouldAward: false };
    }
  }

  private async checkWeeklyStreak(userId: string, action: string, currentStreak: number): Promise<{ currentStreak: number; shouldAward: boolean }> {
    const lastAction = await this.getLastActionDate(userId, action);
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (lastAction && lastAction >= lastWeek) {
      return { currentStreak: currentStreak + 1, shouldAward: false };
    } else {
      return { currentStreak: 1, shouldAward: false };
    }
  }

  private async checkMonthlyStreak(userId: string, action: string, currentStreak: number): Promise<{ currentStreak: number; shouldAward: boolean }> {
    const lastAction = await this.getLastActionDate(userId, action);
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (lastAction && lastAction >= lastMonth) {
      return { currentStreak: currentStreak + 1, shouldAward: false };
    } else {
      return { currentStreak: 1, shouldAward: false };
    }
  }

  private async getLastActionDate(userId: string, action: string): Promise<Date | null> {
    try {
      const lastAction = await client.fetch(`
        *[_type in ["startup", "comment"] && author._ref == $userId] | order(_createdAt desc)[0] {
          _createdAt
        }
      `, { userId });
      
      return lastAction?._createdAt ? new Date(lastAction._createdAt) : null;
    } catch (error) {
      console.error('Error getting last action date:', error);
      return null;
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

// Advanced metric calculations
export class MetricCalculator {
  static async calculateMetric(userId: string, metric: string, timeframe: string): Promise<number> {
    switch (metric) {
      case 'content_quality_score':
        return this.calculateQualityScore(userId, timeframe);
      
      case 'peak_activity_hours':
        return this.calculatePeakHours(userId, timeframe);
      
      case 'innovation_index':
        return this.calculateInnovationIndex(userId, timeframe);
      
      case 'collaboration_projects':
        return this.calculateCollaborationCount(userId, timeframe);
      
      case 'consecutive_days':
        return this.calculateConsecutiveDays(userId, timeframe);
      
      default:
        return this.calculateBasicMetric(userId, metric, timeframe);
    }
  }

  private static async calculateQualityScore(userId: string, timeframe: string): Promise<number> {
    const { start, end } = TimeframeCalculator.calculateTimeframe(timeframe);
    
    try {
      const content = await client.fetch(`
        *[_type in ["startup", "comment"] && author._ref == $userId && _createdAt >= $start && _createdAt <= $end] {
          _type,
          likes,
          dislikes,
          views,
          "commentCount": count(comments),
          "replyCount": count(replies)
        }
      `, { userId, start: start.toISOString(), end: end.toISOString() });
      
      let totalScore = 0;
      let contentCount = 0;
      
      for (const item of content) {
        const score = this.calculateItemScore(item);
        totalScore += score;
        contentCount++;
      }
      
      return contentCount > 0 ? Math.round(totalScore / contentCount) : 0;
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return 0;
    }
  }

  private static calculateItemScore(item: any): number {
    let score = 0;
    
    // Base engagement score
    score += (item.likes || 0) * 2;
    score += (item.views || 0) * 0.1;
    score += (item.commentCount || 0) * 5;
    score += (item.replyCount || 0) * 3;
    
    // Penalty for dislikes
    score -= (item.dislikes || 0) * 3;
    
    // Bonus for startups vs comments
    if (item._type === 'startup') {
      score += 10;
    }
    
    return Math.max(0, score);
  }

  private static async calculatePeakHours(userId: string, timeframe: string): Promise<number> {
    const { start, end } = TimeframeCalculator.calculateTimeframe(timeframe);
    
    try {
      const actions = await client.fetch(`
        *[_type in ["startup", "comment"] && author._ref == $userId && _createdAt >= $start && _createdAt <= $end] {
          _createdAt
        }
      `, { userId, start: start.toISOString(), end: end.toISOString() });
      
      const hourCounts = new Array(24).fill(0);
      
      for (const action of actions) {
        const hour = new Date(action._createdAt).getHours();
        hourCounts[hour]++;
      }
      
      const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
      return maxHour;
    } catch (error) {
      console.error('Error calculating peak hours:', error);
      return 0;
    }
  }

  private static async calculateInnovationIndex(userId: string, timeframe: string): Promise<number> {
    const { start, end } = TimeframeCalculator.calculateTimeframe(timeframe);
    
    try {
      const startups = await client.fetch(`
        *[_type == "startup" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end] {
          category,
          views,
          likes,
          "commentCount": count(comments)
        }
      `, { userId, start: start.toISOString(), end: end.toISOString() });
      
      let innovationScore = 0;
      
      for (const startup of startups) {
        // Base score from engagement
        innovationScore += (startup.views || 0) * 0.01;
        innovationScore += (startup.likes || 0) * 0.1;
        innovationScore += (startup.commentCount || 0) * 0.5;
        
        // Bonus for unique categories
        innovationScore += 5;
      }
      
      return Math.round(innovationScore);
    } catch (error) {
      console.error('Error calculating innovation index:', error);
      return 0;
    }
  }

  private static async calculateCollaborationCount(userId: string, timeframe: string): Promise<number> {
    const { start, end } = TimeframeCalculator.calculateTimeframe(timeframe);
    
    try {
      const collaborations = await client.fetch(`
        count(*[_type == "comment" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end && references(*[_type == "startup"])])
      `, { userId, start: start.toISOString(), end: end.toISOString() });
      
      return collaborations || 0;
    } catch (error) {
      console.error('Error calculating collaboration count:', error);
      return 0;
    }
  }

  private static async calculateConsecutiveDays(userId: string, timeframe: string): Promise<number> {
    try {
      const actions = await client.fetch(`
        *[_type in ["startup", "comment"] && author._ref == $userId] | order(_createdAt desc) {
          _createdAt
        }
      `, { userId });
      
      if (actions.length === 0) return 0;
      
      let consecutiveDays = 1;
      let currentDate = new Date(actions[0]._createdAt);
      
      for (let i = 1; i < actions.length; i++) {
        const actionDate = new Date(actions[i]._createdAt);
        const dayDiff = Math.floor((currentDate.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          consecutiveDays++;
          currentDate = actionDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
      
      return consecutiveDays;
    } catch (error) {
      console.error('Error calculating consecutive days:', error);
      return 0;
    }
  }

  private static async calculateBasicMetric(userId: string, metric: string, timeframe: string): Promise<number> {
    const { start, end } = TimeframeCalculator.calculateTimeframe(timeframe);
    
    try {
      switch (metric) {
        case 'startups_created':
          return await client.fetch(`
            count(*[_type == "startup" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end])
          `, { userId, start: start.toISOString(), end: end.toISOString() });
        
        case 'comments_posted':
          return await client.fetch(`
            count(*[_type == "comment" && author._ref == $userId && !defined(parent) && _createdAt >= $start && _createdAt <= $end])
          `, { userId, start: start.toISOString(), end: end.toISOString() });

        case 'replies_posted':
          return await client.fetch(`
            count(*[_type == "comment" && author._ref == $userId && defined(parent) && _createdAt >= $start && _createdAt <= $end])
          `, { userId, start: start.toISOString(), end: end.toISOString() });
        
        case 'likes_received':
          const likesResult = await client.fetch(`
            *[_type == "startup" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end] {
              "likes": coalesce(likes, 0)
            }
          `, { userId, start: start.toISOString(), end: end.toISOString() });
          return likesResult.reduce((sum: number, item: any) => sum + (item.likes || 0), 0);
        
        case 'followers_gained':
          const followersResult = await client.fetch(`
            *[_type == "author" && _id == $userId][0] {
              "followers": count(followers)
            }
          `, { userId });
          return followersResult?.followers || 0;
        
        case 'views_received':
          const viewsResult = await client.fetch(`
            *[_type == "startup" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end] {
              "views": coalesce(views, 0)
            }
          `, { userId, start: start.toISOString(), end: end.toISOString() });
          return viewsResult.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
        
        case 'days_active': {
          const activityDates = await client.fetch<string[]>(`
            array::unique(
              *[_type in ["startup", "comment"] && author._ref == $userId && _createdAt >= $start && _createdAt <= $end]._createdAt
            )
          `, { userId, start: start.toISOString(), end: end.toISOString() });

          const uniqueDays = new Set(
            (activityDates ?? []).map((iso) => iso.slice(0, 10)),
          );
          return uniqueDays.size;
        }
        
        case 'users_followed':
          const followingResult = await client.fetch(`
            *[_type == "author" && _id == $userId][0] {
              "following": count(following)
            }
          `, { userId });
          return followingResult?.following || 0;
        
        case 'reports_submitted':
          return await client.fetch(`
            count(*[_type == "report" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end])
          `, { userId, start: start.toISOString(), end: end.toISOString() }) || 0;
        
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error calculating metric ${metric}:`, error);
      return 0;
    }
  }
}

// Enhanced badge system class
export class EnhancedBadgeSystem {
  private static instance: EnhancedBadgeSystem;
  private badges: EnhancedBadge[] = [];
  private userBadges: Map<string, any[]> = new Map();
  private streakTracker: StreakTracker;

  private constructor() {
    this.streakTracker = StreakTracker.getInstance();
  }

  static getInstance(): EnhancedBadgeSystem {
    if (!EnhancedBadgeSystem.instance) {
      EnhancedBadgeSystem.instance = new EnhancedBadgeSystem();
    }
    return EnhancedBadgeSystem.instance;
  }

  async initialize() {
    await this.loadBadges();
  }

  /** Clear cached catalog so the next load fetches fresh Sanity data. */
  invalidateBadgeCatalog() {
    this.badges = [];
  }

  private async ensureInitialized(): Promise<void> {
    await this.loadBadges();
  }

  private async loadBadges() {
    const query = `
      *[_type == "badge" && isActive == true] {
        _id,
        name,
        description,
        category,
        icon,
        color,
        metric,
        criteria,
        levels,
        isActive,
        customStyles
      }
    `;

    try {
      const badges = await badgeReadClient.fetch(query);
      this.badges = sortBadgeTracks(badges as EnhancedBadge[]);

      if (this.badges.length === 0) {
        console.warn(
          'Badge catalog empty from Sanity (fresh read). Run: node scripts/seed-badges.js',
        );
      }
    } catch (error) {
      console.error('Failed to load enhanced badges:', error);
      this.badges = [];
    }
  }

  async checkAndAwardBadges(userId: string, action: string, context?: any): Promise<any[]> {
    await this.ensureInitialized();
    const upgraded: any[] = [];

    for (const track of this.badges) {
      if (track.metric !== action) continue;
      const result = await this.syncTrackForUser(userId, track, context);
      if (result?.newlyLeveled) {
        upgraded.push(result.userBadge);
      }
    }

    return upgraded;
  }

  // Recalculate badges for a given user against current data
  invalidateUserBadgeCache(userId: string) {
    this.userBadges.delete(userId);
  }

  async recalculateUserBadges(userId: string): Promise<{ awarded: number; alreadyHad: number; checked: number; details: any[] }>{
    await this.ensureInitialized();
    this.invalidateUserBadgeCache(userId);

    const results: any[] = [];
    let awarded = 0;
    let alreadyHad = 0;
    let checked = 0;

    for (const track of this.badges) {
      checked++;
      try {
        const hadTier = await this.getUserTrackBadge(userId, track._id);
        const syncResult = await this.syncTrackForUser(userId, track, { action: 'recalculate' });

        if (syncResult?.newlyLeveled) {
          awarded++;
          results.push({ badgeId: track._id, name: track.name, awarded: true });
        } else if (hadTier?.currentTier) {
          alreadyHad++;
          results.push({ badgeId: track._id, name: track.name, awarded: false });
        } else {
          results.push({ badgeId: track._id, name: track.name, awarded: false });
        }
      } catch {
        results.push({ badgeId: track._id, name: track.name, error: true });
      }
    }

    return { awarded, alreadyHad, checked, details: results };
  }

  // Recalculate for all users (optionally limited)
  async recalculateAllUsers(limit: number = 100): Promise<{ usersProcessed: number; totalAwarded: number }>{
    await this.ensureInitialized();

    const authors: Array<{ _id: string }> = await client.fetch(`
      *[_type == "author"]{ _id }[0...$limit]
    `, { limit });

    let totalAwarded = 0;
    for (const a of authors) {
      const res = await this.recalculateUserBadges(a._id);
      totalAwarded += res.awarded;
    }

    return { usersProcessed: authors.length, totalAwarded };
  }

  private async getUserTrackBadge(userId: string, trackId: string) {
    const userBadges = await this.getUserBadges(userId);
    return userBadges.find((ub) => ub.badge?._id === trackId) ?? null;
  }

  private tierOrderValue(tier: BadgeTier | null | undefined): number {
    if (!tier) return 0;
    return TIER_ORDER[tier] ?? 0;
  }

  async calculateTrackProgressForUser(userId: string, track: EnhancedBadge) {
    const timeframe = track.criteria?.timeframe ?? 'all_time';
    const metricValue = await MetricCalculator.calculateMetric(
      userId,
      track.metric,
      timeframe,
    );
    const levels = track.levels ?? [];
    return {
      metricValue,
      ...calculateTrackProgress(metricValue, levels),
    };
  }

  private async syncTrackForUser(
    userId: string,
    track: EnhancedBadge,
    context?: Record<string, unknown>,
  ): Promise<{ userBadge: any; newlyLeveled: boolean } | null> {
    const progress = await this.calculateTrackProgressForUser(userId, track);
    if (!progress.currentTier && progress.metricValue <= 0) {
      return null;
    }

    const existing = await this.getUserTrackBadge(userId, track._id);
    const previousTier = existing?.currentTier as BadgeTier | null | undefined;
    const newTier = progress.currentTier;

    if (!newTier) {
      return null;
    }

    const tierAdvanced =
      this.tierOrderValue(newTier) > this.tierOrderValue(previousTier);
    const now = new Date().toISOString();

    const tierHistory = [...(existing?.tierHistory ?? [])];
    if (tierAdvanced) {
      for (const level of track.levels) {
        const alreadyRecorded = tierHistory.some((h: { tier?: string }) => h.tier === level.tier);
        if (
          !alreadyRecorded &&
          progress.metricValue >= level.target &&
          this.tierOrderValue(level.tier) <= this.tierOrderValue(newTier)
        ) {
          tierHistory.push({ tier: level.tier, earnedAt: now });
        }
      }
    }

    const payload = {
      currentTier: newTier,
      earnedAt: existing?.earnedAt ?? now,
      completedAt: progress.isComplete ? (existing?.completedAt ?? now) : undefined,
      progress: progress.progress,
      tierHistory,
      metadata: context
        ? {
            context: context.action as string | undefined,
            relatedContent: context.contentId
              ? { _ref: context.contentId as string, _type: 'reference' as const }
              : undefined,
          }
        : existing?.metadata,
    };

    let userBadge = existing;

    if (existing) {
      await writeClient
        .patch(existing._id)
        .set(payload)
        .commit();
      userBadge = { ...existing, ...payload };
    } else {
      userBadge = await writeClient.create({
        _type: 'userBadge',
        user: { _ref: userId, _type: 'reference' },
        badge: { _ref: track._id, _type: 'reference' },
        ...payload,
      });
    }

    this.invalidateUserBadgeCache(userId);

    if (tierAdvanced) {
      await this.createEnhancedBadgeNotification(userId, track, newTier);
    }

    return { userBadge, newlyLeveled: tierAdvanced };
  }

  async getLeveledBadges(userId: string): Promise<LeveledBadge[]> {
    await this.ensureInitialized();
    const userBadges = await this.getUserBadges(userId);
    const userBadgeByTrack = new Map(
      userBadges.map((ub) => [ub.badge?._id, ub]),
    );

    const results: LeveledBadge[] = [];

    for (const track of this.badges) {
      const progress = await this.calculateTrackProgressForUser(userId, track);
      const userBadge = userBadgeByTrack.get(track._id);

      results.push({
        _id: track._id,
        name: track.name,
        description: track.description,
        category: track.category,
        icon: track.icon,
        color: track.color,
        metric: track.metric,
        levels: track.levels ?? [],
        currentTier: progress.currentTier,
        nextTier: progress.nextTier,
        currentLevelIndex: progress.currentLevelIndex,
        progress: progress.progress,
        isComplete: progress.isComplete,
        isEarned: progress.isComplete,
        earnedAt: userBadge?.earnedAt,
        completedAt: userBadge?.completedAt,
        isActive: track.isActive,
      });
    }

    return results;
  }

  async getUserBadges(userId: string): Promise<any[]> {
    if (this.userBadges.has(userId)) {
      return this.userBadges.get(userId) || [];
    }

    try {
      const userBadges = await client.fetch(`
        *[_type == "userBadge" && user._ref == $userId] {
          _id,
          user,
          currentTier,
          earnedAt,
          completedAt,
          progress,
          tierHistory,
          metadata,
          badge->{
            _id,
            name,
            description,
            category,
            icon,
            color,
            metric,
            criteria,
            levels,
            isActive,
            customStyles
          }
        }
      `, { userId });

      this.userBadges.set(userId, userBadges);
      return userBadges;
    } catch (error) {
      console.error('Failed to load user badges:', error);
      return [];
    }
  }

  async getAllBadges(): Promise<EnhancedBadge[]> {
    await this.ensureInitialized();
    return this.badges;
  }

  /** @deprecated Use getLeveledBadges instead */
  async getNextTierBadges(userId: string): Promise<any[]> {
    const leveled = await this.getLeveledBadges(userId);
    return leveled.filter((t) => !t.isComplete && t.nextTier);
  }

  /** @deprecated Use getLeveledBadges instead */
  async getEvolvingBadges(userId: string): Promise<any[]> {
    return this.getLeveledBadges(userId);
  }

  private async createEnhancedBadgeNotification(
    userId: string,
    track: EnhancedBadge,
    tier: BadgeTier,
  ) {
    try {
      const tierConfig = track.levels.find((l) => l.tier === tier);
      await writeClient.create({
        _type: 'notification',
        recipient: { _ref: userId, _type: 'reference' },
        type: 'system',
        title: `🏆 ${track.name} leveled up to ${tier}!`,
        message: `Congratulations! You've reached ${tier} on ${track.name}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        metadata: tierConfig ? { tier, rarity: tierConfig.rarity } : undefined,
      });
    } catch (error) {
      console.error('Failed to create enhanced badge notification:', error);
    }
  }

  async getBadgeProgress(userId: string): Promise<any[]> {
    const leveled = await this.getLeveledBadges(userId);
    return leveled.map((track) => ({
      badgeId: track._id,
      current: track.progress.current,
      target: track.progress.target,
      percentage: track.progress.percentage,
      isEarned: track.isComplete,
      currentTier: track.currentTier,
      nextTier: track.nextTier,
    }));
  }

  async getUserActivity(userId: string): Promise<any> {
    try {
      // Get user's startups
      const startups = await client.fetch(`
        *[_type == "startup" && author._ref == $userId] {
          _id,
          _createdAt,
          title,
          views,
          likes
        }
      `, { userId });

      // Get user's comments
      const comments = await client.fetch(`
        *[_type == "comment" && author._ref == $userId] {
          _id,
          _createdAt,
          startup->{ _id, title }
        }
      `, { userId });

      // Get user's followers and following
      const user = await client.fetch(`
        *[_type == "author" && _id == $userId] {
          _id,
          name,
          username,
          _createdAt,
          followers,
          following
        }
      `, { userId });

      // Get user's reports
      const reports = await client.fetch(`
        *[_type == "report" && reporter._ref == $userId] {
          _id,
          _createdAt
        }
      `, { userId });

      // Calculate special metrics
      const weekendPosts = startups.filter((startup: any) => {
        const date = new Date(startup._createdAt);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      }).length;

      const nightPosts = startups.filter((startup: any) => {
        const date = new Date(startup._createdAt);
        const hour = date.getHours();
        return hour >= 22 || hour <= 6; // 10 PM to 6 AM
      }).length;

      const earlyPosts = startups.filter((startup: any) => {
        const date = new Date(startup._createdAt);
        const hour = date.getHours();
        return hour >= 5 && hour <= 9; // 5 AM to 9 AM
      }).length;

      // Calculate weekly streak
      const weeklyStreak = this.calculateWeeklyStreak(startups);

      // Calculate total likes
      const totalLikes = startups.reduce((sum: number, startup: any) => sum + (startup.likes || 0), 0);

      // Calculate days active
      const daysActive = user[0]?._createdAt ? 
        Math.floor((new Date().getTime() - new Date(user[0]._createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        startups,
        comments,
        followers: user[0]?.followers || [],
        following: user[0]?.following || [],
        reports,
        weekendPosts,
        nightPosts,
        earlyPosts,
        weeklyStreak,
        totalLikes,
        daysActive
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return {
        startups: [],
        comments: [],
        followers: [],
        following: [],
        reports: [],
        weekendPosts: 0,
        nightPosts: 0,
        earlyPosts: 0,
        weeklyStreak: 0,
        totalLikes: 0,
        daysActive: 0
      };
    }
  }

  private calculateWeeklyStreak(startups: any[]): number {
    if (startups.length === 0) return 0;
    
    const weeks = new Set();
    startups.forEach(startup => {
      const date = new Date(startup._createdAt);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      weeks.add(weekKey);
    });
    
    return weeks.size;
  }

  async getLeaderboard(metric: string, limit: number = 10): Promise<any[]> {
    try {
      switch (metric) {
        case 'startups_created':
          return await client.fetch(`
            *[_type == "author"] {
              _id,
              name,
              username,
              image,
              "count": count(*[_type == "startup" && author._ref == ^._id])
            } | order(count desc) [0...$limit]
          `, { limit });
        
        case 'followers_gained':
          return await client.fetch(`
            *[_type == "author"] {
              _id,
              name,
              username,
              image,
              "count": count(followers)
            } | order(count desc) [0...$limit]
          `, { limit });
        
        case 'likes_received':
          return await client.fetch(`
            *[_type == "author"] {
              _id,
              name,
              username,
              image,
              "count": count(*[_type == "startup" && author._ref == ^._id])
            } | order(count desc) [0...$limit]
          `, { limit });
        
        case 'content_quality_score':
          return await client.fetch(`
            *[_type == "author"] {
              _id,
              name,
              username,
              image,
              "count": count(*[_type == "startup" && author._ref == ^._id])
            } | order(count desc) [0...$limit]
          `, { limit });
        
        default:
          return await client.fetch(`
            *[_type == "author"] | order(_createdAt desc) [0...$limit]
          `, { limit });
      }
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }
}

export const enhancedBadgeSystem = EnhancedBadgeSystem.getInstance();
