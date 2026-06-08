'use client';

import React, { useState, useEffect } from 'react';
import { enhancedBadgeSystem, RARITY_LEVELS, TIER_LEVELS } from '@/lib/badges/enhanced-badge-system';
import EnhancedBadgeDisplay from './EnhancedBadgeDisplay';

interface MyBadgesProps {
  userId: string;
}

interface BadgeWithProgress {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  rarity: string;
  tier: string;
  criteria: any;
  isActive: boolean;
  isEarned: boolean;
  earnedAt?: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  userBadge?: any;
}

export default function MyBadges({ userId }: MyBadgesProps) {
  const [badgesWithProgress, setBadgesWithProgress] = useState<BadgeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState<boolean>(false);
  const [showProgressOnly, setShowProgressOnly] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [currentActiveTier, setCurrentActiveTier] = useState<string>('');

  useEffect(() => {
    loadBadgesWithProgress();
  }, [userId]);

  const loadBadgesWithProgress = async () => {
    try {
      setLoading(true);
      await enhancedBadgeSystem.initialize();

             // Get all badges and user badges
       const [allBadges, userBadges, userActivity] = await Promise.all([
         enhancedBadgeSystem.getAllBadges(),
         enhancedBadgeSystem.getUserBadges(userId),
         enhancedBadgeSystem.getUserActivity(userId)
       ]);

       // Data loaded successfully

             // Create a map of earned badges for quick lookup
       const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge?._id));
       // Earned badges processed

       // Combine all badges with progress information
       const badgesWithProgressData: BadgeWithProgress[] = allBadges.map(badge => {
         const isEarned = earnedBadgeIds.has(badge._id);
         const userBadge = userBadges.find(ub => ub.badge?._id === badge._id);
         
         // Calculate current progress based on user activity
         const progress = calculateProgress(badge, userActivity);
         
         return {
           ...badge,
           isEarned,
           earnedAt: userBadge?.earnedAt,
           progress,
           userBadge
         };
       });

       // Badges with progress data processed
       // Badge data processed successfully
       // Badge tiers processed

             // Sort badges: earned first, then by tier, then by progress percentage
       badgesWithProgressData.sort((a, b) => {
         // First: earned badges come first
         if (a.isEarned && !b.isEarned) return -1;
         if (!a.isEarned && b.isEarned) return 1;
         
         // Second: sort by tier (bronze, silver, gold, platinum, diamond)
         const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
         const aTierOrder = tierOrder[a.tier as keyof typeof tierOrder] || 0;
         const bTierOrder = tierOrder[b.tier as keyof typeof tierOrder] || 0;
         if (aTierOrder !== bTierOrder) return aTierOrder - bTierOrder;
         
         // Third: sort by progress percentage (highest first)
         return b.progress.percentage - a.progress.percentage;
       });

       // Determine current active tier (smart progression based on completion)
       const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
       
       // Calculate completion percentage for each tier
       const tierCompletion = {};
       ['bronze', 'silver', 'gold', 'platinum', 'diamond'].forEach(tier => {
         const tierBadges = badgesWithProgressData.filter(b => b.tier === tier);
         const earnedCount = tierBadges.filter(b => b.isEarned).length;
         const totalCount = tierBadges.length;
         tierCompletion[tier] = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;
       });
       
       // Tier completion calculated
       
       // Find the next tier to work on (tier with some progress but not complete)
       let nextActiveTier = null;
       
       for (const tier of ['bronze', 'silver', 'gold', 'platinum', 'diamond']) {
         const completion = tierCompletion[tier];
         const hasUnearned = badgesWithProgressData.filter(b => b.tier === tier && !b.isEarned).length > 0;
         
         // Tier analysis complete
         
         if (completion > 0 && completion < 100 && hasUnearned) {
           // This tier has some progress but is not complete - this is the current active tier
           nextActiveTier = tier;
           break;
         } else if (completion === 0 && hasUnearned) {
           // This tier has no progress but has unearned badges - this is the starting tier
           nextActiveTier = tier;
           break;
         }
       }
       
       // If no tier found with progress, find the highest tier with any unearned badges
       if (!nextActiveTier) {
         const unearnedBadges = badgesWithProgressData.filter(badge => !badge.isEarned);
         if (unearnedBadges.length > 0) {
           nextActiveTier = unearnedBadges.reduce((highest, badge) => {
             const currentTierOrder = tierOrder[badge.tier as keyof typeof tierOrder] || 0;
             const highestTierOrder = tierOrder[highest as keyof typeof tierOrder] || 0;
             return currentTierOrder > highestTierOrder ? badge.tier : highest;
           }, unearnedBadges[0].tier);
         }
       }
       
       // If still no tier found, show the highest earned tier
       if (!nextActiveTier) {
         const earnedBadges = badgesWithProgressData.filter(badge => badge.isEarned);
         if (earnedBadges.length > 0) {
           nextActiveTier = earnedBadges.reduce((highest, badge) => {
             const currentTierOrder = tierOrder[badge.tier as keyof typeof tierOrder] || 0;
             const highestTierOrder = tierOrder[highest as keyof typeof tierOrder] || 0;
             return currentTierOrder > highestTierOrder ? badge.tier : highest;
           }, earnedBadges[0].tier);
         }
       }
       
       // Active tier determined
       setCurrentActiveTier(nextActiveTier);

       setBadgesWithProgress(badgesWithProgressData);
    } catch (error) {
      console.error('Failed to load badges with progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (badge: any, userActivity: any) => {
    const criteria = badge.criteria;
    if (!criteria) return { current: 0, target: 0, percentage: 0 };

    let current = 0;
    const target = criteria.target || 0;

    switch (criteria.metric) {
      case 'startups_created':
        current = userActivity.startups?.length || 0;
        break;
      case 'comments_posted':
        current = userActivity.comments?.length || 0;
        break;
      case 'followers_gained':
        current = userActivity.followers?.length || 0;
        break;
      case 'users_followed':
        current = userActivity.following?.length || 0;
        break;
      case 'likes_received':
        current = userActivity.totalLikes || 0;
        break;
      case 'reports_submitted':
        current = userActivity.reports?.length || 0;
        break;
      case 'days_active':
        current = userActivity.daysActive || 0;
        break;
      case 'weekend_posts':
        current = userActivity.weekendPosts || 0;
        break;
      case 'night_posts':
        current = userActivity.nightPosts || 0;
        break;
      case 'early_posts':
        current = userActivity.earlyPosts || 0;
        break;
      case 'weekly_streak':
        current = userActivity.weeklyStreak || 0;
        break;
      default:
        current = 0;
    }

    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    
    return { current, target, percentage };
  };

    const getFilteredBadges = () => {
    let filtered = badgesWithProgress;

    // Filter by tier FIRST (before earned status filtering)
    
    if (selectedTier === 'current' && currentActiveTier) {
      filtered = filtered.filter(badge => badge.tier === currentActiveTier);
    } else if (selectedTier !== 'all' && selectedTier !== 'current') {
      filtered = filtered.filter(badge => badge.tier === selectedTier);
    } else if (selectedTier === 'all') {
      // Show all tiers when "All Tiers" is explicitly selected
      // No filtering needed
    } else if (currentActiveTier && !showCompleted && !showEarnedOnly && !showProgressOnly) {
      // By default, show only the current active tier
      filtered = filtered.filter(badge => badge.tier === currentActiveTier);
    }

    // Filter by earned status AFTER tier filtering
    
    if (showEarnedOnly) {
      filtered = filtered.filter(badge => badge.isEarned);
    } else if (showProgressOnly) {
      filtered = filtered.filter(badge => !badge.isEarned && badge.progress.percentage > 0);
    } else if (selectedTier === 'current' && !showCompleted) {
      // For "Current Active Tier", show only unearned badges (not completed ones)
      filtered = filtered.filter(badge => !badge.isEarned);
    } else if (selectedTier === 'all' && !showCompleted) {
      // For "All Tiers", hide completed badges when showCompleted is false
      filtered = filtered.filter(badge => !badge.isEarned);
    } else if (selectedTier !== 'all' && selectedTier !== 'current' && !showCompleted) {
      // For specific tiers, show all badges (both earned and unearned) when showCompleted is true
      // This allows users to see their achievements in that tier
    } else {
      // When showCompleted is true, show all badges (both earned and unearned)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === selectedCategory);
    }

    return filtered;
  };

  const getCategoryOptions = () => {
    const categories = ['all', ...new Set(badgesWithProgress.map(badge => badge.category).filter(Boolean))];
    return categories.map(cat => ({
      value: cat,
      label: cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)
    }));
  };

     const getTierOptions = () => {
     const tiers = ['all', ...new Set(badgesWithProgress.map(badge => badge.tier).filter(Boolean))];
     return tiers.map(tier => ({
       value: tier,
       label: tier === 'all' ? 'All Tiers' : TIER_LEVELS[tier as keyof typeof TIER_LEVELS]?.label || tier
     }));
   };

  const getStatistics = () => {
    const total = badgesWithProgress.length;
    const earned = badgesWithProgress.filter(b => b.isEarned).length;
    const inProgress = badgesWithProgress.filter(b => !b.isEarned && b.progress.percentage > 0).length;
    const notStarted = badgesWithProgress.filter(b => !b.isEarned && b.progress.percentage === 0).length;
    const completionRate = total > 0 ? Math.round((earned / total) * 100) : 0;

    return { total, earned, inProgress, notStarted, completionRate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStatistics();
  const filteredBadges = getFilteredBadges();
            
            return (
    <div className="space-y-6">
             {/* Header with Statistics */}
       <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
         <h1 className="text-3xl font-bold mb-2">🏆 My Badges</h1>
         <p className="text-blue-100">Track your achievements and progress</p>
         {currentActiveTier && !showCompleted && !showEarnedOnly && !showProgressOnly && (selectedTier === 'all' || selectedTier === 'current') && (
           <div className="mt-2 text-blue-200">
             Currently showing: <span className="font-semibold">{TIER_LEVELS[currentActiveTier as keyof typeof TIER_LEVELS]?.label || currentActiveTier} Tier</span>
                    </div>
                  )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-blue-200">Total Badges</div>
                    </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.earned}</div>
            <div className="text-sm text-blue-200">Earned</div>
                </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <div className="text-sm text-blue-200">In Progress</div>
        </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.notStarted}</div>
            <div className="text-sm text-blue-200">Not Started</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-sm text-blue-200">Completion</div>
        </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {getCategoryOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select 
           value={selectedTier}
           onChange={(e) => setSelectedTier(e.target.value)}
           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
           <option value="all">All Tiers</option>
           <option value="current">Current Active Tier</option>
           {getTierOptions().filter(option => option.value !== 'all').map(option => (
             <option key={option.value} value={option.value}>
               {option.label}
             </option>
           ))}
        </select>
        
                 <div className="flex gap-2">
           <button
             onClick={() => {
               setShowCompleted(!showCompleted);
               setShowEarnedOnly(false);
               setShowProgressOnly(false);
             }}
             className={`px-4 py-2 text-sm rounded-lg transition-colors ${
               showCompleted 
                 ? 'bg-purple-600 text-white hover:bg-purple-700' 
                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
             }`}
           >
             Show Completed
           </button>
           <button
             onClick={() => {
               setShowEarnedOnly(!showEarnedOnly);
               setShowProgressOnly(false);
               setShowCompleted(false);
             }}
             className={`px-4 py-2 text-sm rounded-lg transition-colors ${
               showEarnedOnly 
                 ? 'bg-green-600 text-white hover:bg-green-700' 
                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
             }`}
           >
             Earned Only
           </button>
           <button
             onClick={() => {
               setShowProgressOnly(!showProgressOnly);
               setShowEarnedOnly(false);
               setShowCompleted(false);
             }}
             className={`px-4 py-2 text-sm rounded-lg transition-colors ${
               showProgressOnly 
                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
             }`}
           >
             In Progress Only
           </button>
         </div>

                 <button
           onClick={() => {
             setSelectedCategory('all');
             setSelectedTier('current');
             setShowEarnedOnly(false);
             setShowProgressOnly(false);
             setShowCompleted(false);
           }}
           className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
         >
           Reset to Current Tier
         </button>
      </div>

             {/* Badges Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filteredBadges.length === 0 ? (
           <div className="col-span-full text-center py-12 text-gray-500">
             <div className="text-4xl mb-4">🎯</div>
             <p>
               {!showCompleted && !showEarnedOnly && !showProgressOnly 
                 ? "No unearned badges found with current filters" 
                 : "No badges found with current filters"
               }
             </p>
             <p className="text-sm">
               {!showCompleted && !showEarnedOnly && !showProgressOnly 
                 ? "Try adjusting your filters or check 'Show Completed' to see earned badges!" 
                 : "Try adjusting your filters or earn some badges!"
               }
             </p>
           </div>
         ) : (
          filteredBadges.map((badge) => {
            const rarityStyle = RARITY_LEVELS[badge.rarity as keyof typeof RARITY_LEVELS];
            const tierStyle = TIER_LEVELS[badge.tier as keyof typeof TIER_LEVELS];
          
          return (
            <div
              key={badge._id}
                className={`bg-white rounded-lg p-4 shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                  badge.isEarned 
                    ? 'border-green-200 bg-green-50' 
                    : badge.progress.percentage > 0 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200'
              }`}
            >
              {/* Badge Header */}
                <div className="flex items-center mb-3">
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-3"
                  style={{ 
                      backgroundColor: rarityStyle?.bgColor || '#F3F4F6',
                      color: rarityStyle?.color || '#6B7280',
                      border: `2px solid ${rarityStyle?.borderColor || '#D1D5DB'}`
                  }}
                >
                    {badge.icon || '🏅'}
                </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <div className="flex gap-1 mt-1">
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: rarityStyle?.bgColor || '#F3F4F6',
                          color: rarityStyle?.color || '#6B7280'
                        }}
                      >
                        {rarityStyle?.label || badge.rarity}
                      </span>
                      {tierStyle && (
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                  style={{
                            backgroundColor: tierStyle.bgColor,
                            color: tierStyle.color
                          }}
                        >
                          {tierStyle.icon} {tierStyle.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {badge.isEarned && (
                    <div className="text-green-600 text-2xl">✓</div>
                  )}
                </div>

                {/* Badge Description */}
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {badge.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                    <span>{badge.progress.percentage}%</span>
                    </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                      className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${badge.progress.percentage}%`,
                        backgroundColor: badge.isEarned 
                          ? '#10B981' 
                          : badge.progress.percentage > 0 
                            ? '#3B82F6' 
                            : '#9CA3AF'
                        }}
                      />
                    </div>
                    </div>

                {/* Progress Details */}
                <div className="text-xs text-gray-500 mb-2">
                  {badge.progress.current} / {badge.progress.target}
                  </div>

                {/* Status */}
                <div className="text-xs font-medium">
                  {badge.isEarned ? (
                    <span className="text-green-600">
                      ✓ Earned {badge.earnedAt && `on ${new Date(badge.earnedAt).toLocaleDateString()}`}
                    </span>
                  ) : badge.progress.percentage > 0 ? (
                    <span className="text-blue-600">
                      🔄 In Progress
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      ⏳ Not Started
                    </span>
                  )}
                  </div>

                {/* Category */}
                <div className="mt-2 text-xs text-gray-400 capitalize">
                  {badge.category} • {badge.criteria?.metric?.replace('_', ' ') || 'Unknown metric'}
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          Showing {filteredBadges.length} of {stats.total} badges
          {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
          {selectedTier !== 'all' && ` at ${TIER_LEVELS[selectedTier as keyof typeof TIER_LEVELS]?.label || selectedTier} tier`}
        </div>
      </div>
    </div>
  );
}
