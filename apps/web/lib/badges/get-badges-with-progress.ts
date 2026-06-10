import {
  type BadgeStats,
  type LeveledBadge,
} from '@foundrly/shared/badges';
import { enhancedBadgeSystem } from '@/lib/badges/enhanced-badge-system';

export type { LeveledBadge, BadgeStats } from '@foundrly/shared/badges';

/** @deprecated Use LeveledBadge */
export type BadgeWithProgress = LeveledBadge;

export interface BadgesWithProgressResult {
  badges: LeveledBadge[];
  stats: BadgeStats;
}

function buildStats(badges: LeveledBadge[]): BadgeStats {
  const total = badges.length;
  const earned = badges.filter((b) => b.isComplete).length;
  const inProgress = badges.filter(
    (b) => !b.isComplete && (b.currentTier != null || b.progress.percentage > 0),
  ).length;
  const notStarted = badges.filter(
    (b) => !b.isComplete && b.currentTier == null && b.progress.percentage === 0,
  ).length;
  const completionRate = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { total, earned, inProgress, notStarted, completionRate };
}

export async function getBadgesWithProgress(
  userId: string,
): Promise<BadgesWithProgressResult> {
  await enhancedBadgeSystem.initialize();

  const badges = await enhancedBadgeSystem.getLeveledBadges(userId);

  badges.sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    if (a.progress.percentage !== b.progress.percentage) {
      return b.progress.percentage - a.progress.percentage;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    badges,
    stats: buildStats(badges),
  };
}
