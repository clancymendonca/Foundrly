import { enhancedBadgeSystem } from '@/lib/badges/enhanced-badge-system';

/** Retroactively award eligible badges and refresh progress for one user. */
export async function syncUserBadges(userId: string) {
  enhancedBadgeSystem.invalidateBadgeCatalog();
  await enhancedBadgeSystem.initialize();
  enhancedBadgeSystem.invalidateUserBadgeCache(userId);
  return enhancedBadgeSystem.recalculateUserBadges(userId);
}
