'use client';

import React, { useState, useEffect } from 'react';
import { enhancedBadgeSystem, RARITY_LEVELS, TIER_LEVELS, EXTENDED_METRICS } from '@/lib/badges/enhanced-badge-system';
import EnhancedBadgeDisplay from './EnhancedBadgeDisplay';
import Leaderboard from './Leaderboard';

interface BadgeDashboardProps {
  userId: string;
  showProgress?: boolean;
  showLeaderboards?: boolean;
  showStatistics?: boolean;
}

export default function BadgeDashboard({ 
  userId, 
  showProgress = true, 
  showLeaderboards = true,
  showStatistics = true
}: BadgeDashboardProps) {
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [nextTierBadges, setNextTierBadges] = useState<any[]>([]);
  const [evolvingBadges, setEvolvingBadges] = useState<any[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'progress' | 'leaderboards' | 'stats'>('badges');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showAllBadges, setShowAllBadges] = useState<boolean>(false);
  const [useEvolvingBadges, setUseEvolvingBadges] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Ensure badges are loaded before computing progress
      await enhancedBadgeSystem.initialize();

      const [badges, allBadgesData, nextTierData, evolvingData, progress] = await Promise.all([
        enhancedBadgeSystem.getUserBadges(userId),
        enhancedBadgeSystem.getAllBadges(),
        enhancedBadgeSystem.getNextTierBadges(userId),
        enhancedBadgeSystem.getEvolvingBadges(userId),
        enhancedBadgeSystem.getBadgeProgress(userId)
      ]);
      
      setUserBadges(badges);
      setAllBadges(allBadgesData);
      setNextTierBadges(nextTierData);
      setEvolvingBadges(evolvingData);
      setBadgeProgress(progress);
      
      if (showStatistics) {
        const stats = calculateStatistics(badges, progress);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Failed to load badge dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (badges: any[], progress: any[]) => {
    const stats = {
      totalBadges: badges.length,
      totalProgress: progress.length,
      earnedBadges: badges.filter(b => b.earnedAt).length,
      inProgress: progress.filter(p => !p.isEarned).length,
      completionRate: badges.length > 0 ? Math.round((badges.filter(b => b.earnedAt).length / badges.length) * 100) : 0,
      rarityBreakdown: {} as { [key: string]: number },
      categoryBreakdown: {} as { [key: string]: number },
      totalPoints: 0,
      averageProgress: 0
    };

    // Calculate rarity breakdown
    badges.forEach(badge => {
      const rarity = badge.badge?.rarity || 'common';
      stats.rarityBreakdown[rarity] = (stats.rarityBreakdown[rarity] || 0) + 1;
    });

    // Calculate category breakdown
    badges.forEach(badge => {
      const category = badge.badge?.category || 'unknown';
      stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
    });

    // Calculate total points and average progress
    let totalPoints = 0;
    let totalProgressValue = 0;
    
    badges.forEach(badge => {
      const rarity = badge.badge?.rarity || 'common';
      const multiplier = RARITY_LEVELS[rarity]?.multiplier || 1;
      totalPoints += multiplier;
    });

    progress.forEach(p => {
      totalProgressValue += p.percentage || 0;
    });

    stats.totalPoints = totalPoints;
    stats.averageProgress = progress.length > 0 ? Math.round(totalProgressValue / progress.length) : 0;

    return stats;
  };

  const getFilteredBadges = () => {
    let filtered = userBadges;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.badge?.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(badge => badge.badge?.rarity === selectedRarity);
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(badge => badge.badge?.tier === selectedTier);
    }

    return filtered;
  };

  const getFilteredProgress = () => {
    let filtered = badgeProgress;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const badge = userBadges.find(b => b.badge?._id === p.badgeId);
        return badge?.badge?.category === selectedCategory;
      });
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(p => {
        const badge = userBadges.find(b => b.badge?._id === p.badgeId);
        return badge?.badge?.rarity === selectedRarity;
      });
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(p => {
        const badge = userBadges.find(b => b.badge?._id === p.badgeId);
        return badge?.badge?.tier === selectedTier;
      });
    }

    return filtered;
  };

  const getCategoryOptions = () => {
    const categories = ['all', ...new Set(allBadges.map(badge => badge.category).filter(Boolean))];
    return categories.map(cat => ({
      value: cat,
      label: cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)
    }));
  };

  const getRarityOptions = () => {
    const rarities = ['all', ...Object.keys(RARITY_LEVELS)];
    return rarities.map(rarity => ({
      value: rarity,
      label: rarity === 'all' ? 'All Rarities' : RARITY_LEVELS[rarity as keyof typeof RARITY_LEVELS]?.label || rarity
    }));
  };

  const getTierOptions = () => {
    const tiers = ['all', ...Object.keys(TIER_LEVELS)];
    return tiers.map(tier => ({
      value: tier,
      label: tier === 'all' ? 'All Tiers' : TIER_LEVELS[tier as keyof typeof TIER_LEVELS]?.label || tier
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🏆 Badge Dashboard</h1>
        <p className="text-blue-100">Track your achievements and progress</p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics.earnedBadges}</div>
            <div className="text-sm text-blue-200">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics.inProgress}</div>
            <div className="text-sm text-blue-200">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics.completionRate}%</div>
            <div className="text-sm text-blue-200">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics.totalPoints}</div>
            <div className="text-sm text-blue-200">Total Points</div>
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
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {getRarityOptions().map(option => (
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
          {getTierOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedRarity('all');
            setSelectedTier('all');
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'badges', label: 'My Badges', icon: '🏆' },
            { id: 'progress', label: 'Progress', icon: '📊' },
            { id: 'leaderboards', label: 'Leaderboards', icon: '🏅' },
            { id: 'stats', label: 'Statistics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-64">
        {activeTab === 'badges' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Badges</h2>
            {getFilteredBadges().length > 0 ? (
              <EnhancedBadgeDisplay
                badges={getFilteredBadges()}
                showProgress={showProgress}
                showRarity={true}
                showCategory={true}
                interactive={true}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <p>No badges found with current filters</p>
                <p className="text-sm">Try adjusting your filters or earn some badges!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {useEvolvingBadges 
                  ? `Evolving Badges (${evolvingBadges.length} active)` 
                  : showAllBadges 
                    ? `Badge Progress (${allBadges.length} total badges)` 
                    : `Next Tier Badges (${nextTierBadges.length} available)`
                }
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setUseEvolvingBadges(!useEvolvingBadges)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    useEvolvingBadges 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {useEvolvingBadges ? 'Evolving Mode' : 'Standard Mode'}
                </button>
                {!useEvolvingBadges && (
                  <button
                    onClick={() => setShowAllBadges(!showAllBadges)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showAllBadges ? 'Show Next Tier Only' : 'Show All Badges'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(useEvolvingBadges ? evolvingBadges : (showAllBadges ? allBadges : nextTierBadges)).length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <p>
                    {useEvolvingBadges 
                      ? 'No evolving badges available' 
                      : showAllBadges 
                        ? 'No badges found in the system' 
                        : 'No next tier badges available'
                    }
                  </p>
                  <p className="text-sm">
                    {useEvolvingBadges 
                      ? 'You may have completed all available badges!' 
                      : showAllBadges 
                        ? 'Make sure badges are seeded in Sanity' 
                        : 'You may have completed all available badges!'
                    }
                  </p>
                </div>
              ) : (
                (useEvolvingBadges ? evolvingBadges : (showAllBadges ? allBadges : nextTierBadges)).map((badge) => {
                  // Use progress from evolving badge if available, otherwise fall back to badgeProgress
                  const progress = useEvolvingBadges && badge.progress ? badge.progress : badgeProgress.find(p => p.badgeId === badge._id);
                  const isEarned = useEvolvingBadges && badge.evolution ? badge.evolution.isEarned : userBadges.some(ub => ub.badge?._id === badge._id);
                  const rarityStyle = RARITY_LEVELS[badge.rarity || 'common'];
                  
                  // Skip if filtered out
                  if (selectedCategory !== 'all' && badge.category !== selectedCategory) return null;
                  if (selectedRarity !== 'all' && badge.rarity !== selectedRarity) return null;
                  if (selectedTier !== 'all' && badge.tier !== selectedTier) return null;
                  
                  // Badge rendering logic
                  
                  return (
                    <div key={badge._id} className="bg-white rounded-lg p-4 shadow-md">
                      <div className="flex items-center mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg mr-3"
                          style={{
                            backgroundColor: rarityStyle.bgColor,
                            color: rarityStyle.color,
                            border: `2px solid ${rarityStyle.borderColor}`
                          }}
                        >
                          {badge.icon || '🏅'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{badge.name}</h3>
                          <div className="flex gap-1">
                            <span 
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: rarityStyle.bgColor,
                                color: rarityStyle.color
                              }}
                            >
                              {rarityStyle.label}
                            </span>
                            {badge.tier && (
                              <span 
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: TIER_LEVELS[badge.tier]?.bgColor || '#F3F4F6',
                                  color: TIER_LEVELS[badge.tier]?.color || '#6B7280'
                                }}
                              >
                                {TIER_LEVELS[badge.tier]?.icon} {TIER_LEVELS[badge.tier]?.label}
                              </span>
                            )}
                            {useEvolvingBadges && badge.evolution && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                {badge.evolution.progressInCategory}/{badge.evolution.totalInCategory}
                              </span>
                            )}
                          </div>
                          {useEvolvingBadges && badge.evolution && (
                            <div className="mt-1 text-xs text-gray-500">
                              {badge.evolution.previousTier && (
                                <span>Evolved from {TIER_LEVELS[badge.evolution.previousTier]?.label} </span>
                              )}
                              {badge.evolution.nextTier && !badge.evolution.isMaxTier && (
                                <span>→ Next: {TIER_LEVELS[badge.evolution.nextTier]?.label}</span>
                              )}
                              {badge.evolution.isMaxTier && (
                                <span className="text-green-600">✨ Max tier reached!</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress ? progress.percentage : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${progress ? progress.percentage : 0}%`,
                              backgroundColor: rarityStyle.color
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {progress ? progress.current : 0} / {progress ? progress.target : badge.criteria?.target || 0}
                      </div>
                      
                      {isEarned && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Earned
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboards' && showLeaderboards && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Leaderboards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Leaderboard metric="startups_created" title="Top Creators" limit={5} />
              <Leaderboard metric="followers_gained" title="Most Followed" limit={5} />
              <Leaderboard metric="likes_received" title="Most Liked" limit={5} />
              <Leaderboard metric="content_quality_score" title="Quality Leaders" limit={5} />
            </div>
          </div>
        )}

        {activeTab === 'stats' && showStatistics && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Detailed Statistics</h2>
            
            {/* Rarity Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Badge Rarity Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(statistics.rarityBreakdown || {}).map(([rarity, count]) => {
                  const rarityConfig = RARITY_LEVELS[rarity as keyof typeof RARITY_LEVELS];
                  if (!rarityConfig) return null;
                  
                  return (
                    <div key={rarity} className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2"
                        style={{
                          backgroundColor: rarityConfig.bgColor,
                          color: rarityConfig.color,
                          border: `3px solid ${rarityConfig.borderColor}`
                        }}
                      >
                        {rarity === 'mythical' ? '👑' : 
                         rarity === 'legendary' ? '🔥' :
                         rarity === 'epic' ? '⚡' :
                         rarity === 'rare' ? '💎' :
                         rarity === 'uncommon' ? '🌿' : '📜'}
                      </div>
                      <div className="font-semibold text-gray-900">{rarityConfig.label}</div>
                      <div className="text-2xl font-bold" style={{ color: rarityConfig.color }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Badge Category Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(statistics.categoryBreakdown || {}).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-2">
                      {category === 'creator' ? '🚀' :
                       category === 'community' ? '💬' :
                       category === 'social' ? '🦋' :
                       category === 'achievement' ? '🏆' :
                       category === 'special' ? '⭐' : '🎯'}
                    </div>
                    <div className="font-semibold text-gray-900 capitalize">{category}</div>
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{statistics.completionRate}%</div>
                  <div className="text-gray-600">Overall Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{statistics.averageProgress}%</div>
                  <div className="text-gray-600">Average Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
