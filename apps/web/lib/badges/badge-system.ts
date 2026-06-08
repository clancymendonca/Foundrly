/** Canonical base badge system. See enhanced-badge-system.ts for the extended tier/rarity implementation used in production UI. */
import { client } from '@/sanity/lib/client';

export interface BadgeCriteria {
  type: 'count' | 'streak' | 'date' | 'combination';
  target: number;
  metric: string;
  timeframe: string;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  rarity: string;
  criteria: BadgeCriteria;
  isActive: boolean;
}

export interface UserBadge {
  _id: string;
  user: string;
  badge: Badge;
  earnedAt: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  metadata?: {
    context?: string;
    relatedContent?: string;
  };
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  percentage: number;
  isEarned: boolean;
}

export class BadgeSystem {
  private static instance: BadgeSystem;
  private badges: Badge[] = [];
  private userBadges: Map<string, UserBadge[]> = new Map();

  private constructor() {}

  static getInstance(): BadgeSystem {
    if (!BadgeSystem.instance) {
      BadgeSystem.instance = new BadgeSystem();
    }
    return BadgeSystem.instance;
  }

  async initialize() {
    await this.loadBadges();
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
          isActive
        }
      `);
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
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
            criteria
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

  async checkAndAwardBadges(userId: string, action: string, context?: any): Promise<UserBadge[]> {
    const newBadges: UserBadge[] = [];
    
    for (const badge of this.badges) {
      if (badge.criteria.metric === action) {
        const progress = await this.calculateProgress(userId, badge);
        
        if (progress.isEarned && !(await this.hasBadge(userId, badge._id))) {
          const userBadge = await this.awardBadge(userId, badge, progress, context);
          if (userBadge) {
            newBadges.push(userBadge);
          }
        }
      }
    }

    return newBadges;
  }

  private async calculateProgress(userId: string, badge: Badge): Promise<BadgeProgress> {
    const { metric, target, timeframe } = badge.criteria;
    
    let current = 0;
    
    switch (metric) {
      case 'startups_created':
        current = await this.getStartupCount(userId, timeframe);
        break;
      case 'comments_posted':
        current = await this.getCommentCount(userId, timeframe);
        break;
      case 'likes_received':
        current = await this.getLikesReceived(userId, timeframe);
        break;
      case 'followers_gained':
        current = await this.getFollowersCount(userId);
        break;
      case 'users_followed':
        current = await this.getFollowingCount(userId);
        break;
      case 'views_received':
        current = await this.getViewsReceived(userId, timeframe);
        break;
      case 'days_active':
        current = await this.getDaysActive(userId);
        break;
      case 'reports_submitted':
        current = await this.getReportsCount(userId, timeframe);
        break;
    }

    const percentage = Math.min((current / target) * 100, 100);
    const isEarned = current >= target;

    return {
      badgeId: badge._id,
      current,
      target,
      percentage,
      isEarned
    };
  }

  private async getStartupCount(userId: string, timeframe: string): Promise<number> {
    const query = this.buildTimeframeQuery('startup', timeframe);
    return await client.fetch(`
      count(*[_type == "startup" && author._ref == $userId ${query}])
    `, { userId });
  }

  private async getCommentCount(userId: string, timeframe: string): Promise<number> {
    const query = this.buildTimeframeQuery('comment', timeframe);
    return await client.fetch(`
      count(*[_type == "comment" && author._ref == $userId ${query}])
    `, { userId });
  }

  private async getLikesReceived(userId: string, timeframe: string): Promise<number> {
    const query = this.buildTimeframeQuery('startup', timeframe);
    return await client.fetch(`
      count(*[_type == "startup" && author._ref == $userId ${query}].likes)
    `, { userId }) || 0;
  }

  private async getFollowersCount(userId: string): Promise<number> {
    return await client.fetch(`
      count(*[_type == "author" && _id == $userId].followers)
    `, { userId });
  }

  private async getFollowingCount(userId: string): Promise<number> {
    return await client.fetch(`
      count(*[_type == "author" && _id == $userId].following)
    `, { userId });
  }

  private async getViewsReceived(userId: string, timeframe: string): Promise<number> {
    const query = this.buildTimeframeQuery('startup', timeframe);
    return await client.fetch(`
      count(*[_type == "startup" && author._ref == $userId ${query}].views)
    `, { userId }) || 0;
  }

  private async getDaysActive(userId: string): Promise<number> {
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
  }

  private async getReportsCount(userId: string, timeframe: string): Promise<number> {
    const query = this.buildTimeframeQuery('report', timeframe);
    return await client.fetch(`
      count(*[_type == "report" && reportedBy._ref == $userId ${query}])
    `, { userId });
  }

  private buildTimeframeQuery(type: string, timeframe: string): string {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return '';
    }

    return `&& _createdAt >= "${startDate.toISOString()}"`;
  }

  private async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const userBadges = await this.getUserBadges(userId);
    return userBadges.some(ub => ub.badge._id === badgeId);
  }

  private async awardBadge(userId: string, badge: Badge, progress: BadgeProgress, context?: any): Promise<UserBadge | null> {
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
      await this.createBadgeNotification(userId, badge);

      return userBadge;
    } catch (error) {
      console.error('Failed to award badge:', error);
      return null;
    }
  }

  private async createBadgeNotification(userId: string, badge: Badge) {
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
      console.error('Failed to create badge notification:', error);
    }
  }

  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const progress: BadgeProgress[] = [];
    
    for (const badge of this.badges) {
      const badgeProgress = await this.calculateProgress(userId, badge);
      progress.push(badgeProgress);
    }

    return progress;
  }

  async getLeaderboard(metric: string, limit: number = 10): Promise<any[]> {
    const query = this.buildLeaderboardQuery(metric);
    return await client.fetch(query, { limit });
  }

  private buildLeaderboardQuery(metric: string): string {
    switch (metric) {
      case 'startups_created':
        return `
          *[_type == "author"] {
            _id,
            name,
            username,
            image,
            "count": count(*[_type == "startup" && author._ref == ^._id])
          } | order(count desc) [0...$limit]
        `;
      case 'followers_gained':
        return `
          *[_type == "author"] {
            _id,
            name,
            username,
            image,
            "count": count(followers)
          } | order(count desc) [0...$limit]
        `;
      case 'likes_received':
        return `
          *[_type == "author"] {
            _id,
            name,
            username,
            image,
            "count": count(*[_type == "startup" && author._ref == ^._id])
          } | order(count desc) [0...$limit]
        `;
      default:
        return `*[_type == "author"] | order(_createdAt desc) [0...$limit]`;
    }
  }
}

export const badgeSystem = BadgeSystem.getInstance();
