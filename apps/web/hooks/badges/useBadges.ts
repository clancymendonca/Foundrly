import { useState, useEffect, useCallback } from 'react';
import { badgeSystem, UserBadge, BadgeProgress } from '@/lib/badges/badge-system';

interface UseBadgesReturn {
  badges: UserBadge[];
  progress: BadgeProgress[];
  loading: boolean;
  error: string | null;
  refreshBadges: () => Promise<void>;
  checkForNewBadges: (action: string, context?: any) => Promise<UserBadge[]>;
}

export function useBadges(userId: string | null): UseBadgesReturn {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBadges = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [userBadges, badgeProgress] = await Promise.all([
        badgeSystem.getUserBadges(userId),
        badgeSystem.getBadgeProgress(userId)
      ]);
      
      setBadges(userBadges);
      setProgress(badgeProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load badges');
      console.error('Error loading badges:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshBadges = useCallback(async () => {
    await loadBadges();
  }, [loadBadges]);

  const checkForNewBadges = useCallback(async (action: string, context?: any): Promise<UserBadge[]> => {
    if (!userId) return [];
    
    try {
      const newBadges = await badgeSystem.checkAndAwardBadges(userId, action, context);
      
      if (newBadges.length > 0) {
        // Refresh badges to show newly earned ones
        await loadBadges();
      }
      
      return newBadges;
    } catch (err) {
      console.error('Error checking for new badges:', err);
      return [];
    }
  }, [userId, loadBadges]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    badges,
    progress,
    loading,
    error,
    refreshBadges,
    checkForNewBadges
  };
}
