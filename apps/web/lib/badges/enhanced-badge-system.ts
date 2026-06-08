/** Canonical enhanced badge system (primary API for badges UI and recalculation). */
import { client } from '@/sanity/lib/client';

// Enhanced rarity levels with custom styling
export const RARITY_LEVELS = {
  common: {
    label: "Common",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    multiplier: 1.0
  },
  uncommon: {
    label: "Uncommon", 
    color: "#059669",
    bgColor: "#D1FAE5",
    borderColor: "#34D399",
    multiplier: 1.5
  },
  rare: {
    label: "Rare",
    color: "#2563EB", 
    bgColor: "#DBEAFE",
    borderColor: "#60A5FA",
    multiplier: 2.0
  },
  epic: {
    label: "Epic",
    color: "#7C3AED",
    bgColor: "#EDE9FE", 
    borderColor: "#A78BFA",
    multiplier: 3.0
  },
  legendary: {
    label: "Legendary",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    borderColor: "#F87171", 
    multiplier: 5.0
  },
  mythical: {
    label: "Mythical",
    color: "#FFD700",
    bgColor: "#FEF3C7",
    borderColor: "#FCD34D",
    multiplier: 10.0
  }
};

// Tier levels with custom styling
export const TIER_LEVELS = {
  bronze: {
    label: "Bronze",
    color: "#CD7F32",
    bgColor: "#FDF2F8",
    borderColor: "#F472B6",
    icon: "🥉",
    multiplier: 1.0
  },
  silver: {
    label: "Silver", 
    color: "#C0C0C0",
    bgColor: "#F8FAFC",
    borderColor: "#94A3B8",
    icon: "🥈",
    multiplier: 1.2
  },
  gold: {
    label: "Gold",
    color: "#FFD700", 
    bgColor: "#FFFBEB",
    borderColor: "#FCD34D",
    icon: "🥇",
    multiplier: 1.5
  },
  platinum: {
    label: "Platinum",
    color: "#E5E4E2",
    bgColor: "#F1F5F9", 
    borderColor: "#CBD5E1",
    icon: "💎",
    multiplier: 2.0
  },
  diamond: {
    label: "Diamond",
    color: "#B9F2FF",
    bgColor: "#F0FDFF",
    borderColor: "#67E8F9", 
    icon: "💠",
    multiplier: 3.0
  }
};

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
  target: number;
  metric: string;
  timeframe: string;
  requirements?: {
    metric: string;
    target: number;
    timeframe: string;
    operator: 'AND' | 'OR' | 'XOR';
  }[];
  bonusMultiplier?: number;
  customConditions?: string[];
}

// Enhanced badge interface
export interface EnhancedBadge {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  rarity: keyof typeof RARITY_LEVELS;
  criteria: EnhancedBadgeCriteria;
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
  private userStreaks: Map<string, Map<string, number>> = new Map();

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
            count(*[_type == "comment" && author._ref == $userId && _createdAt >= $start && _createdAt <= $end])
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
        
        case 'days_active':
          const user = await client.fetch(`
            *[_type == "author" && _id == $userId][0] {
              _createdAt
            }
          `, { userId });
          
          if (!user?._createdAt) return 0;
          
          const created = new Date(user._createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - created.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
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

  private async ensureInitialized(): Promise<void> {
    if (!this.badges || this.badges.length === 0) {
      await this.loadBadges();
    }
  }

  private async loadBadges() {
    try {
      this.badges = await client.fetch(`
        *[_type == "badge" && isActive == true] | order(category asc, target asc) {
          _id,
          name,
          description,
          category,
          icon,
          color,
          rarity,
          criteria,
          isActive,
          customStyles
        }
      `);
    } catch (error) {
      console.error('Failed to load enhanced badges:', error);
    }
  }

  async checkAndAwardBadges(userId: string, action: string, context?: any): Promise<any[]> {
    const newBadges: any[] = [];
    
    for (const badge of this.badges) {
      if (this.shouldCheckBadge(badge, action)) {
        const progress = await this.calculateEnhancedProgress(userId, badge);
        
        if (progress.isEarned && !(await this.hasBadge(userId, badge._id))) {
          const userBadge = await this.awardEnhancedBadge(userId, badge, progress, context);
          if (userBadge) {
            newBadges.push(userBadge);
          }
        }
      }
    }

    return newBadges;
  }

  // Recalculate badges for a given user against current data
  async recalculateUserBadges(userId: string): Promise<{ awarded: number; alreadyHad: number; checked: number; details: any[] }>{
    await this.ensureInitialized();

    const results: any[] = [];
    let awarded = 0;
    let alreadyHad = 0;
    let checked = 0;

    for (const badge of this.badges) {
      checked++;
      try {
        const hasAlready = await this.hasBadge(userId, badge._id);
        const progress = await this.calculateEnhancedProgress(userId, badge);

        if (progress.isEarned) {
          if (!hasAlready) {
            const created = await this.awardEnhancedBadge(userId, badge, progress, { action: 'recalculate' });
            awarded++;
            results.push({ badgeId: badge._id, name: badge.name, awarded: true });
          } else {
            alreadyHad++;
            results.push({ badgeId: badge._id, name: badge.name, awarded: false });
          }
        }
      } catch (error) {
        // continue with next badge
        results.push({ badgeId: badge._id, name: badge.name, error: true });
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

  private shouldCheckBadge(badge: EnhancedBadge, action: string): boolean {
    if (badge.criteria.metric === action) return true;
    
    // Check combination criteria
    if (badge.criteria.type === 'combination' && badge.criteria.requirements) {
      return badge.criteria.requirements.some(req => req.metric === action);
    }
    
    return false;
  }

  private async calculateEnhancedProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    const { criteria } = badge;
    
    switch (criteria.type) {
      case 'streak':
        return await this.calculateStreakProgress(userId, badge);
      case 'combination':
        return await this.calculateCombinationProgress(userId, badge);
      case 'quality':
        return await this.calculateQualityProgress(userId, badge);
      case 'time':
        return await this.calculateTimeProgress(userId, badge);
      default:
        return await this.calculateBasicProgress(userId, badge);
    }
  }

  private async calculateStreakProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    const { metric, target, timeframe } = badge.criteria;
    
    const streakResult = await this.streakTracker.checkStreakBadge(userId, metric, timeframe);
    
    // Fix the math: ensure current and target are numbers, and handle edge cases
    const currentNum = typeof streakResult.currentStreak === 'number' ? streakResult.currentStreak : 0;
    const targetNum = typeof target === 'number' ? target : 1;
    
    // Calculate percentage correctly
    const percentage = targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
    const isEarned = currentNum >= targetNum;
    
    return {
      badgeId: badge._id,
      current: currentNum,
      target: targetNum,
      percentage: Math.round(percentage),
      isEarned
    };
  }

  private async calculateCombinationProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    if (!badge.criteria.requirements) {
      return { badgeId: badge._id, current: 0, target: 1, percentage: 0, isEarned: false };
    }
    
    let allRequirementsMet = true;
    let totalProgress = 0;
    
    for (const requirement of badge.criteria.requirements) {
      const progress = await MetricCalculator.calculateMetric(
        userId, 
        requirement.metric, 
        requirement.timeframe
      );
      
      if (progress < requirement.target) {
        allRequirementsMet = false;
      }
      
      totalProgress += Math.min(progress / requirement.target, 1);
    }
    
    const averageProgress = totalProgress / badge.criteria.requirements.length;
    const isEarned = allRequirementsMet;
    
    return {
      badgeId: badge._id,
      current: Math.round(averageProgress * 100),
      target: 100,
      percentage: Math.round(averageProgress * 100),
      isEarned
    };
  }

  private async calculateQualityProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    const { metric, target, timeframe } = badge.criteria;
    
    const current = await MetricCalculator.calculateMetric(userId, metric, timeframe);
    
    // Fix the math: ensure current and target are numbers, and handle edge cases
    const currentNum = typeof current === 'number' ? current : 0;
    const targetNum = typeof target === 'number' ? target : 1;
    
    // Calculate percentage correctly
    const percentage = targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
    const isEarned = currentNum >= targetNum;
    
    return {
      badgeId: badge._id,
      current: currentNum,
      target: targetNum,
      percentage: Math.round(percentage),
      isEarned
    };
  }

  private async calculateTimeProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    const { metric, target, timeframe } = badge.criteria;
    
    const current = await MetricCalculator.calculateMetric(userId, metric, timeframe);
    
    // Fix the math: ensure current and target are numbers, and handle edge cases
    const currentNum = typeof current === 'number' ? current : 0;
    const targetNum = typeof target === 'number' ? target : 1;
    
    // Calculate percentage correctly
    const percentage = targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
    const isEarned = currentNum >= targetNum;
    
    return {
      badgeId: badge._id,
      current: currentNum,
      target: targetNum,
      percentage: Math.round(percentage),
      isEarned
    };
  }

  private async calculateBasicProgress(userId: string, badge: EnhancedBadge): Promise<any> {
    const { metric, target, timeframe } = badge.criteria;
    
    const current = await MetricCalculator.calculateMetric(userId, metric, timeframe);
    
    // Fix the math: ensure current and target are numbers, and handle edge cases
    const currentNum = typeof current === 'number' ? current : 0;
    const targetNum = typeof target === 'number' ? target : 1;
    
    // Calculate percentage correctly
    const percentage = targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
    const isEarned = currentNum >= targetNum;
    
    return {
      badgeId: badge._id,
      current: currentNum,
      target: targetNum,
      percentage: Math.round(percentage),
      isEarned
    };
  }

  private async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const userBadges = await this.getUserBadges(userId);
    return userBadges.some(ub => ub.badge._id === badgeId);
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
          badge->{
            _id,
            name,
            description,
            category,
            icon,
            color,
            rarity,
            criteria,
            customStyles
          },
          earnedAt,
          progress,
          metadata
        }
      `, { userId });

      this.userBadges.set(userId, userBadges);
      return userBadges;
    } catch (error) {
      console.error('Failed to load user badges:', error);
      return [];
    }
  }

  async getAllBadges(): Promise<any[]> {
    try {
      const allBadges = await client.fetch(`
        *[_type == "badge" && isActive == true] | order(category asc, target asc) {
          _id,
          name,
          description,
          category,
          icon,
          color,
          rarity,
          tier,
          criteria,
          customStyles,
          isActive
        }
      `);
      return allBadges;
    } catch (error) {
      console.error('Failed to load all badges:', error);
      return [];
    }
  }

  async getNextTierBadges(userId: string): Promise<any[]> {
    try {
      const allBadges = await this.getAllBadges();
      const userBadges = await this.getUserBadges(userId);
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge._id));
      
      // Group badges by category and tier
      const badgesByCategory: { [key: string]: any[] } = {};
      
      allBadges.forEach(badge => {
        if (!badgesByCategory[badge.category]) {
          badgesByCategory[badge.category] = [];
        }
        badgesByCategory[badge.category].push(badge);
      });
      
      // Sort badges within each category by tier order
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      Object.keys(badgesByCategory).forEach(category => {
        badgesByCategory[category].sort((a, b) => {
          const aIndex = tierOrder.indexOf(a.tier);
          const bIndex = tierOrder.indexOf(b.tier);
          return aIndex - bIndex;
        });
      });
      
      // Find the next unearned badge for each category
      const nextTierBadges: any[] = [];
      
      Object.keys(badgesByCategory).forEach(category => {
        const categoryBadges = badgesByCategory[category];
        let nextBadge = null;
        
        for (const badge of categoryBadges) {
          if (!earnedBadgeIds.has(badge._id)) {
            nextBadge = badge;
            break;
          }
        }
        
        if (nextBadge) {
          nextTierBadges.push(nextBadge);
        }
      });
      
      return nextTierBadges;
    } catch (error) {
      console.error('Failed to get next tier badges:', error);
      return [];
    }
  }

  async getEvolvingBadges(userId: string): Promise<any[]> {
    try {
      const allBadges = await this.getAllBadges();
      const userBadges = await this.getUserBadges(userId);
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge._id));
      
      // Group badges by category and tier
      const badgesByCategory: { [key: string]: any[] } = {};
      
      allBadges.forEach(badge => {
        if (!badgesByCategory[badge.category]) {
          badgesByCategory[badge.category] = [];
        }
        badgesByCategory[badge.category].push(badge);
      });
      
      // Sort badges within each category by tier order
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      Object.keys(badgesByCategory).forEach(category => {
        badgesByCategory[category].sort((a, b) => {
          const aIndex = tierOrder.indexOf(a.tier);
          const bIndex = tierOrder.indexOf(b.tier);
          return aIndex - bIndex;
        });
      });
      
      // For each category, find the current evolving badge
      const evolvingBadges: any[] = [];
      
      for (const category of Object.keys(badgesByCategory)) {
        const categoryBadges = badgesByCategory[category];
        let currentBadge = null;
        let highestEarnedTier = -1;
        
        // Check each badge in order to find the current evolving badge
        for (let i = 0; i < categoryBadges.length; i++) {
          const badge = categoryBadges[i];
          
          // Calculate current progress for this badge
          const progress = await this.calculateEnhancedProgress(userId, badge);
          
          if (progress.isEarned) {
            // User has earned this badge, mark it as the highest earned
            highestEarnedTier = i;
          } else {
            // User hasn't earned this badge yet, this is the current evolving badge
            currentBadge = badge;
            break;
          }
        }
        
        // If all badges in category are earned, show the last one as max tier
        if (!currentBadge && categoryBadges.length > 0) {
          currentBadge = categoryBadges[categoryBadges.length - 1];
          highestEarnedTier = categoryBadges.length - 1;
        }
        
        if (currentBadge) {
          // Calculate progress for the current evolving badge
          const progress = await this.calculateEnhancedProgress(userId, currentBadge);
          
          // Add evolution metadata
          const evolutionData = {
            ...currentBadge,
            progress: progress, // Include the actual progress data
            evolution: {
              currentTier: currentBadge.tier,
              tierIndex: tierOrder.indexOf(currentBadge.tier),
              maxTier: tierOrder.length - 1,
              isMaxTier: tierOrder.indexOf(currentBadge.tier) === tierOrder.length - 1,
              previousTier: highestEarnedTier >= 0 ? categoryBadges[highestEarnedTier]?.tier : null,
              nextTier: tierOrder.indexOf(currentBadge.tier) < tierOrder.length - 1 ? tierOrder[tierOrder.indexOf(currentBadge.tier) + 1] : null,
              progressInCategory: highestEarnedTier + 1,
              totalInCategory: categoryBadges.length,
              isEarned: progress.isEarned
            }
          };
          evolvingBadges.push(evolutionData);
        }
      }
      
      return evolvingBadges;
    } catch (error) {
      console.error('Failed to get evolving badges:', error);
      return [];
    }
  }

  private async awardEnhancedBadge(userId: string, badge: EnhancedBadge, progress: any, context?: any): Promise<any> {
    try {
      const userBadge = await client.create({
        _type: 'userBadge',
        user: { _ref: userId, _type: 'reference' },
        badge: { _ref: badge._id, _type: 'reference' },
        earnedAt: new Date().toISOString(),
        progress: {
          current: progress.current,
          target: progress.target,
          percentage: progress.percentage
        },
        metadata: context ? {
          context: context.action,
          relatedContent: context.contentId
        } : undefined
      });

      // Update cache
      const userBadges = this.userBadges.get(userId) || [];
      userBadges.push(userBadge);
      this.userBadges.set(userId, userBadges);

      // Create notification for badge earned
      await this.createEnhancedBadgeNotification(userId, badge);

      return userBadge;
    } catch (error) {
      console.error('Failed to award enhanced badge:', error);
      return null;
    }
  }

  private async createEnhancedBadgeNotification(userId: string, badge: EnhancedBadge) {
    try {
      await client.create({
        _type: 'notification',
        recipient: { _ref: userId, _type: 'reference' },
        type: 'system',
        title: `🏆 Badge Earned: ${badge.name}!`,
        message: `Congratulations! You've earned the ${badge.name} badge: ${badge.description}`,
        timestamp: new Date().toISOString(),
        isRead: false
      });
    } catch (error) {
      console.error('Failed to create enhanced badge notification:', error);
    }
  }

  async getBadgeProgress(userId: string): Promise<any[]> {
    const progress: any[] = [];
    
    for (const badge of this.badges) {
      const badgeProgress = await this.calculateEnhancedProgress(userId, badge);
      progress.push(badgeProgress);
    }

    return progress;
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
