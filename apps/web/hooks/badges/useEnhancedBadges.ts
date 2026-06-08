import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedBadgeSystem, RARITY_LEVELS, EXTENDED_METRICS } from '@/lib/badges/enhanced-badge-system';

interface UseEnhancedBadgesReturn {
  // State
  badges: any[];
  progress: any[];
  statistics: any;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshBadges: () => Promise<void>;
  checkForNewBadges: (action: string, context?: any) => Promise<any[]>;
  getBadgeProgress: () => Promise<void>;
  getStatistics: () => Promise<void>;
  
  // Filters
  filteredBadges: any[];
  filteredProgress: any[];
  setCategoryFilter: (category: string) => void;
  setRarityFilter: (rarity: string) => void;
  clearFilters: () => void;
  
  // Utilities
  getRarityConfig: (rarity: string) => any;
  getMetricLabel: (metric: string) => string;
  calculateCompletionRate: () => number;
  getNextBadgeToEarn: () => any;
}

export function useEnhancedBadges(userId: string | null): UseEnhancedBadgesReturn {
  const [badges, setBadges] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  
  // Cache for performance
  const cacheRef = useRef<{
    badges: Map<string, any[]>;
    progress: Map<string, any[]>;
    statistics: Map<string, any>;
    lastUpdate: Map<string, number>;
  }>({
    badges: new Map(),
    progress: new Map(),
    statistics: new Map(),
    lastUpdate: new Map()
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Initialize the badge system
  useEffect(() => {
    if (userId) {
      enhancedBadgeSystem.initialize();
    }
  }, [userId]);

  // Load badges
  const loadBadges = useCallback(async () => {
    if (!userId) return;
    
    const cacheKey = `badges_${userId}`;
    const cached = cacheRef.current.badges.get(cacheKey);
    const lastUpdate = cacheRef.current.lastUpdate.get(cacheKey) || 0;
    
    // Use cache if still valid
    if (cached && Date.now() - lastUpdate < CACHE_DURATION) {
      setBadges(cached);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userBadges = await enhancedBadgeSystem.getUserBadges(userId);
      
      // Update cache
      cacheRef.current.badges.set(cacheKey, userBadges);
      cacheRef.current.lastUpdate.set(cacheKey, Date.now());
      
      setBadges(userBadges);
    } catch (err) {
      setError('Failed to load badges');
      console.error('Error loading badges:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load progress
  const loadProgress = useCallback(async () => {
    if (!userId) return;
    
    const cacheKey = `progress_${userId}`;
    const cached = cacheRef.current.progress.get(cacheKey);
    const lastUpdate = cacheRef.current.lastUpdate.get(cacheKey) || 0;
    
    // Use cache if still valid
    if (cached && Date.now() - lastUpdate < CACHE_DURATION) {
      setProgress(cached);
      return;
    }
    
    try {
      const badgeProgress = await enhancedBadgeSystem.getBadgeProgress(userId);
      
      // Update cache
      cacheRef.current.progress.set(cacheKey, badgeProgress);
      cacheRef.current.lastUpdate.set(cacheKey, Date.now());
      
      setProgress(badgeProgress);
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  }, [userId]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!userId) return;
    
    const cacheKey = `statistics_${userId}`;
    const cached = cacheRef.current.statistics.get(cacheKey);
    const lastUpdate = cacheRef.current.lastUpdate.get(cacheKey) || 0;
    
    // Use cache if still valid
    if (cached && Date.now() - lastUpdate < CACHE_DURATION) {
      setStatistics(cached);
      return;
    }
    
    try {
      const stats = calculateStatistics(badges, progress);
      
      // Update cache
      cacheRef.current.statistics.set(cacheKey, stats);
      cacheRef.current.lastUpdate.set(cacheKey, Date.now());
      
      setStatistics(stats);
    } catch (err) {
      console.error('Error calculating statistics:', err);
    }
  }, [userId, badges, progress]);

  // Calculate statistics
  const calculateStatistics = useCallback((badges: any[], progress: any[]) => {
    const stats = {
      totalBadges: badges.length,
      totalProgress: progress.length,
      earnedBadges: badges.filter(b => b.earnedAt).length,
      inProgress: progress.filter(p => !p.isEarned).length,
      completionRate: badges.length > 0 ? Math.round((badges.filter(b => b.earnedAt).length / badges.length) * 100) : 0,
      rarityBreakdown: {} as { [key: string]: number },
      categoryBreakdown: {} as { [key: string]: number },
      totalPoints: 0,
      averageProgress: 0,
      recentBadges: [] as any[],
      upcomingBadges: [] as any[]
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

    // Get recent badges (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentBadges = badges
      .filter(b => b.earnedAt && new Date(b.earnedAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 5);

    // Get upcoming badges (closest to completion)
    stats.upcomingBadges = progress
      .filter(p => !p.isEarned && p.percentage > 50)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    return stats;
  }, []);

  // Check for new badges
  const checkForNewBadges = useCallback(async (action: string, context?: any): Promise<any[]> => {
    if (!userId) return [];
    
    try {
      const newBadges = await enhancedBadgeSystem.checkAndAwardBadges(userId, action, context);
      
      if (newBadges.length > 0) {
        // Refresh data after awarding new badges
        await Promise.all([loadBadges(), loadProgress()]);
      }
      
      return newBadges;
    } catch (err) {
      console.error('Error checking for new badges:', err);
      return [];
    }
  }, [userId, loadBadges, loadProgress]);

  // Refresh all data
  const refreshBadges = useCallback(async () => {
    if (!userId) return;
    
    // Clear cache
    cacheRef.current.badges.clear();
    cacheRef.current.progress.clear();
    cacheRef.current.statistics.clear();
    cacheRef.current.lastUpdate.clear();
    
    // Reload data
    await Promise.all([loadBadges(), loadProgress(), loadStatistics()]);
  }, [userId, loadBadges, loadProgress, loadStatistics]);

  // Get badge progress
  const getBadgeProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  // Get statistics
  const getStatistics = useCallback(async () => {
    await loadStatistics();
  }, [loadStatistics]);

  // Filter badges
  const getFilteredBadges = useCallback(() => {
    let filtered = badges;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(badge => badge.badge?.category === categoryFilter);
    }

    if (rarityFilter !== 'all') {
      filtered = filtered.filter(badge => badge.badge?.rarity === rarityFilter);
    }

    return filtered;
  }, [badges, categoryFilter, rarityFilter]);

  // Filter progress
  const getFilteredProgress = useCallback(() => {
    let filtered = progress;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => {
        const badge = badges.find(b => b.badge?._id === p.badgeId);
        return badge?.badge?.category === categoryFilter;
      });
    }

    if (rarityFilter !== 'all') {
      filtered = filtered.filter(p => {
        const badge = badges.find(b => b.badge?._id === p.badgeId);
        return badge?.badge?.rarity === rarityFilter;
      });
    }

    return filtered;
  }, [progress, badges, categoryFilter, rarityFilter]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setCategoryFilter('all');
    setRarityFilter('all');
  }, []);

  // Get rarity configuration
  const getRarityConfig = useCallback((rarity: string) => {
    return RARITY_LEVELS[rarity as keyof typeof RARITY_LEVELS] || RARITY_LEVELS.common;
  }, []);

  // Get metric label
  const getMetricLabel = useCallback((metric: string) => {
    const metricMap: { [key: string]: string } = {
      startups_created: 'Startups Created',
      comments_posted: 'Comments Posted',
      likes_received: 'Likes Received',
      followers_gained: 'Followers Gained',
      views_received: 'Views Received',
      days_active: 'Days Active',
      content_quality_score: 'Content Quality Score',
      innovation_index: 'Innovation Index'
    };
    
    return metricMap[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Calculate completion rate
  const calculateCompletionRate = useCallback(() => {
    if (badges.length === 0) return 0;
    return Math.round((badges.filter(b => b.earnedAt).length / badges.length) * 100);
  }, [badges]);

  // Get next badge to earn
  const getNextBadgeToEarn = useCallback(() => {
    const unearnedProgress = progress
      .filter(p => !p.isEarned)
      .sort((a, b) => b.percentage - a.percentage);
    
    if (unearnedProgress.length === 0) return null;
    
    const nextProgress = unearnedProgress[0];
    const badge = badges.find(b => b.badge?._id === nextProgress.badgeId);
    
    return badge ? { ...badge, progress: nextProgress } : null;
  }, [progress, badges]);

  // Load data on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadBadges();
      loadProgress();
    }
  }, [userId, loadBadges, loadProgress]);

  // Update statistics when badges or progress change
  useEffect(() => {
    if (userId && badges.length > 0) {
      loadStatistics();
    }
  }, [userId, badges, progress, loadStatistics]);

  return {
    // State
    badges,
    progress,
    statistics,
    loading,
    error,
    
    // Actions
    refreshBadges,
    checkForNewBadges,
    getBadgeProgress,
    getStatistics,
    
    // Filters
    filteredBadges: getFilteredBadges(),
    filteredProgress: getFilteredProgress(),
    setCategoryFilter,
    setRarityFilter,
    clearFilters,
    
    // Utilities
    getRarityConfig,
    getMetricLabel,
    calculateCompletionRate,
    getNextBadgeToEarn
  };
}
