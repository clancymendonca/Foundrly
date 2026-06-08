'use client';

import React, { useState, useEffect } from 'react';
import { enhancedBadgeSystem, TIER_LEVELS, RARITY_LEVELS } from '@/lib/badges/enhanced-badge-system';
import { client } from '@/sanity/lib/client';
import Link from 'next/link';

// Enhanced category definitions with icons and descriptions
export const BADGE_CATEGORIES = {
  creator: {
    label: 'Creator',
    icon: '🎨',
    description: 'Content creation and innovation',
    color: '#3B82F6'
  },
  community: {
    label: 'Community',
    icon: '🤝',
    description: 'Community building and engagement',
    color: '#10B981'
  },
  social: {
    label: 'Social',
    icon: '💬',
    description: 'Social interactions and networking',
    color: '#8B5CF6'
  },
  achievement: {
    label: 'Achievement',
    icon: '🏆',
    description: 'Milestones and accomplishments',
    color: '#F59E0B'
  },
  special: {
    label: 'Special Event',
    icon: '⭐',
    description: 'Special events and unique opportunities',
    color: '#EF4444'
  }
} as const;

interface BadgeLeaderboardEntry {
  _id: string;
  name: string;
  username: string;
  image?: string;
  totalBadges: number;
  highestTier: string;
  highestTierCount: number;
  categoryBreakdown: {
    [category: string]: {
      total: number;
      highestTier: string;
    };
  };
  rarityBreakdown: {
    [rarity: string]: number;
  };
  userBadges: any[];
}

interface BadgeLeaderboardProps {
  metric?: 'total_badges' | 'highest_tier' | 'category' | 'rarity';
  category?: string;
  rarity?: string;
  tier?: string;
  limit?: number;
  title?: string;
}

export default function BadgeLeaderboard({ 
  metric = 'total_badges',
  category,
  rarity,
  tier,
  limit = 10,
  title
}: BadgeLeaderboardProps) {
  const [entries, setEntries] = useState<BadgeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);

  useEffect(() => {
    loadBadgeLeaderboard();
  }, [selectedMetric, category, rarity, tier, limit]);

  const loadBadgeLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get all users with their badge data
      const allUsers = await client.fetch(`
        *[_type == "author"] {
          _id,
          name,
          username,
          image
        }
      `) || [];

      // Get all user badges
      const allUserBadges = await client.fetch(`
        *[_type == "userBadge"] {
          _id,
          user->{
            _id,
            name,
            username,
            image
          },
          badge->{
            _id,
            name,
            category,
            tier,
            rarity
          },
          earnedAt
        }
      `) || [];

      // Process user badge data
      const userBadgeMap = new Map();
      allUserBadges.forEach((userBadge: any) => {
        // Skip userBadges with null or undefined user references
        if (!userBadge.user || !userBadge.user._id) {
          return;
        }
        const userId = userBadge.user._id;
        if (!userBadgeMap.has(userId)) {
          userBadgeMap.set(userId, []);
        }
        userBadgeMap.get(userId).push(userBadge);
      });

      // Calculate leaderboard entries
      const leaderboardEntries: BadgeLeaderboardEntry[] = allUsers
        .map((user: any) => {
          const userBadges = userBadgeMap.get(user._id) || [];
          const badges = userBadges.map((ub: any) => ub.badge).filter((badge: any) => badge && badge._id);
          
          // Calculate total badges
          const totalBadges = badges.length;
          
          // Calculate highest tier
          const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
          const highestTier = badges.reduce((highest: string, badge: any) => {
            if (!badge.tier) return highest;
            const currentTierOrder = tierOrder[badge.tier as keyof typeof tierOrder] || 0;
            const highestTierOrder = tierOrder[highest as keyof typeof tierOrder] || 0;
            return currentTierOrder > highestTierOrder ? badge.tier : highest;
          }, 'bronze');
          
          const highestTierCount = badges.filter((badge: any) => badge.tier === highestTier).length;
          
          // Calculate category breakdown
          const categoryBreakdown: { [category: string]: { total: number; highestTier: string } } = {};
          badges.forEach((badge: any) => {
            if (!badge.category || !badge.tier) return;
            if (!categoryBreakdown[badge.category]) {
              categoryBreakdown[badge.category] = { total: 0, highestTier: 'bronze' };
            }
            categoryBreakdown[badge.category].total++;
            
            const currentTierOrder = tierOrder[badge.tier as keyof typeof tierOrder] || 0;
            const highestTierOrder = tierOrder[categoryBreakdown[badge.category].highestTier as keyof typeof tierOrder] || 0;
            if (currentTierOrder > highestTierOrder) {
              categoryBreakdown[badge.category].highestTier = badge.tier;
            }
          });
          
          // Calculate rarity breakdown
          const rarityBreakdown: { [rarity: string]: number } = {};
          badges.forEach((badge: any) => {
            if (!badge.rarity) return;
            rarityBreakdown[badge.rarity] = (rarityBreakdown[badge.rarity] || 0) + 1;
          });
          
          return {
            _id: user._id,
            name: user.name,
            username: user.username,
            image: user.image,
            totalBadges,
            highestTier,
            highestTierCount,
            categoryBreakdown,
            rarityBreakdown,
            userBadges
          };
        })
        .filter((entry: BadgeLeaderboardEntry) => {
          // Apply filters
          if (category && !entry.categoryBreakdown[category]) return false;
          if (rarity && !entry.rarityBreakdown[rarity]) return false;
          if (tier && entry.highestTier !== tier) return false;
          return true;
        })
        .sort((a: BadgeLeaderboardEntry, b: BadgeLeaderboardEntry) => {
          // Sort based on selected metric
          switch (selectedMetric) {
            case 'total_badges':
              return b.totalBadges - a.totalBadges;
            case 'highest_tier':
              const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
              const aTierOrder = tierOrder[a.highestTier as keyof typeof tierOrder] || 0;
              const bTierOrder = tierOrder[b.highestTier as keyof typeof tierOrder] || 0;
              if (aTierOrder !== bTierOrder) return bTierOrder - aTierOrder;
              return b.highestTierCount - a.highestTierCount;
            case 'category':
              if (category) {
                const aCategoryTotal = a.categoryBreakdown[category]?.total || 0;
                const bCategoryTotal = b.categoryBreakdown[category]?.total || 0;
                return bCategoryTotal - aCategoryTotal;
              }
              return b.totalBadges - a.totalBadges;
            case 'rarity':
              if (rarity) {
                const aRarityCount = a.rarityBreakdown[rarity] || 0;
                const bRarityCount = b.rarityBreakdown[rarity] || 0;
                return bRarityCount - aRarityCount;
              }
              return b.totalBadges - a.totalBadges;
            default:
              return b.totalBadges - a.totalBadges;
          }
        })
        .slice(0, limit);


      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Failed to load badge leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'total_badges':
        return 'Total Badges';
      case 'highest_tier':
        return 'Highest Tier';
      case 'category':
        return category ? `${category} Badges` : 'Category Badges';
      case 'rarity':
        return rarity ? `${rarity} Badges` : 'Rarity Badges';
      default:
        return 'Badges';
    }
  };

  const getMetricValue = (entry: BadgeLeaderboardEntry) => {
    switch (selectedMetric) {
      case 'total_badges':
        return entry.totalBadges;
      case 'highest_tier':
        return `${TIER_LEVELS[entry.highestTier as keyof typeof TIER_LEVELS]?.label || entry.highestTier} (${entry.highestTierCount})`;
      case 'category':
        if (category) {
          return entry.categoryBreakdown[category]?.total || 0;
        }
        return entry.totalBadges;
      case 'rarity':
        if (rarity) {
          return entry.rarityBreakdown[rarity] || 0;
        }
        return entry.totalBadges;
      default:
        return entry.totalBadges;
    }
  };

  const getDisplayTitle = () => {
    if (title) return title;
    
    switch (selectedMetric) {
      case 'total_badges':
        return '🏆 Badge Champions';
      case 'highest_tier':
        return '💎 Elite Badge Collectors';
      case 'category':
        return category ? `${BADGE_CATEGORIES[category as keyof typeof BADGE_CATEGORIES]?.label || category} Masters` : 'Category Leaders';
      case 'rarity':
        return rarity ? `${RARITY_LEVELS[rarity as keyof typeof RARITY_LEVELS]?.label || rarity} Collectors` : 'Rarity Leaders';
      default:
        return '🏆 Badge Leaderboard';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{getDisplayTitle()}</h3>
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getDisplayTitle()}</h3>
        
        {/* Metric Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedMetric('total_badges')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedMetric === 'total_badges'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setSelectedMetric('highest_tier')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedMetric === 'highest_tier'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tier
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {entries.length === 0 ? (
          <div className="flex items-center space-x-3 p-3 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 text-lg font-bold text-gray-300">
              #1
            </div>
            
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 font-medium text-sm">?</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-400 truncate">
                No data available
              </div>
              <div className="text-sm text-gray-300">
                @placeholder
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-gray-400">
                0
              </div>
              <div className="text-xs text-gray-300">
                {getMetricLabel()}
              </div>
            </div>
          </div>
        ) : (
          entries.map((entry, index) => (
            <Link
              key={entry._id}
              href={`/user/${entry.username}`}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 text-lg font-bold">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-shrink-0">
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-sm">
                      {(entry.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {entry.name}
                </div>
                <div className="text-sm text-gray-500">
                  @{entry.username}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {entry.highestTier !== 'bronze' && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: TIER_LEVELS[entry.highestTier as keyof typeof TIER_LEVELS]?.bgColor,
                        color: TIER_LEVELS[entry.highestTier as keyof typeof TIER_LEVELS]?.color,
                        border: `1px solid ${TIER_LEVELS[entry.highestTier as keyof typeof TIER_LEVELS]?.borderColor}`
                      }}
                    >
                      {TIER_LEVELS[entry.highestTier as keyof typeof TIER_LEVELS]?.label}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {typeof getMetricValue(entry) === 'number' 
                    ? getMetricValue(entry).toLocaleString()
                    : getMetricValue(entry)
                  }
                </div>
                <div className="text-xs text-gray-500">
                  {getMetricLabel()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={loadBadgeLeaderboard}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
