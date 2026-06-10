import { enhancedBadgeSystem } from '@/lib/badges/enhanced-badge-system';

/** Check and award badges for a user action. Safe to fire-and-forget. */
export async function awardBadgesForAction(
  userId: string,
  action: string,
  context?: Record<string, unknown>,
) {
  await enhancedBadgeSystem.initialize();
  return enhancedBadgeSystem.checkAndAwardBadges(userId, action, context);
}
