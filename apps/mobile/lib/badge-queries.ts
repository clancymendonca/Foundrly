import { createClient } from "@sanity/client";
import {
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from "@/lib/config";
import { sanityClient } from "@/lib/sanity";
import type { LeveledBadge } from "@/lib/badges";
import { calculateTrackProgress, type BadgeLevel } from "@foundrly/shared/badges";

const badgeCatalogClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: false,
});

export const BADGE_TRACKS_QUERY = `*[_type == "badge" && isActive == true] | order(category asc, name asc) {
  _id,
  name,
  description,
  category,
  icon,
  color,
  metric,
  levels,
  isActive
}`;

export const USER_BADGES_QUERY = `*[_type == "userBadge" && user._ref == $userId && defined(currentTier)] {
  _id,
  earnedAt,
  completedAt,
  currentTier,
  progress,
  badge->{
    _id, name, description, category, icon, color,
    metric, levels, isActive
  }
} | order(earnedAt desc)`;

export type UserBadgeRow = {
  _id: string;
  earnedAt?: string;
  completedAt?: string;
  currentTier?: string;
  progress?: { current?: number; target?: number; percentage?: number };
  badge?: {
    _id?: string;
    name?: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    metric?: string;
    levels?: LeveledBadge["levels"];
    isActive?: boolean;
  } | null;
};

export async function fetchUserBadges(userId: string): Promise<UserBadgeRow[]> {
  return sanityClient.fetch<UserBadgeRow[]>(USER_BADGES_QUERY, { userId });
}

type SanityBadgeTrack = {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  metric: string;
  levels: BadgeLevel[];
  isActive?: boolean;
};

/** Fallback when API catalog is empty — loads tracks from Sanity directly. */
export async function fetchBadgeTracksFromSanity(): Promise<LeveledBadge[]> {
  const tracks = await badgeCatalogClient.fetch<SanityBadgeTrack[]>(
    BADGE_TRACKS_QUERY,
  );

  return tracks.map((track) => {
    const levels = track.levels ?? [];
    const progress = calculateTrackProgress(0, levels);
    return {
      _id: track._id,
      name: track.name,
      description: track.description,
      category: track.category,
      icon: track.icon,
      color: track.color,
      metric: track.metric,
      levels,
      currentTier: progress.currentTier,
      nextTier: progress.nextTier,
      currentLevelIndex: progress.currentLevelIndex,
      progress: progress.progress,
      isComplete: progress.isComplete,
      isEarned: progress.isComplete,
      isActive: track.isActive ?? true,
    };
  });
}

export function buildBadgeStats(badges: LeveledBadge[]) {
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

export function rowsToLeveledBadges(rows: UserBadgeRow[]): LeveledBadge[] {
  return rows
    .filter((row) => row.badge?._id && row.currentTier)
    .map((row) => {
      const badge = row.badge!;
      const levels = badge.levels ?? [];
      const currentTier = row.currentTier as LeveledBadge["currentTier"];
      const isComplete = currentTier === "diamond";
      const levelIndex = levels.findIndex((l) => l.tier === currentTier);
      const nextTier =
        levelIndex >= 0 && levelIndex < levels.length - 1
          ? levels[levelIndex + 1].tier
          : null;

      return {
        _id: badge._id!,
        name: badge.name ?? "",
        description: badge.description ?? "",
        category: badge.category ?? "",
        icon: badge.icon ?? "",
        color: badge.color ?? "",
        metric: badge.metric ?? "",
        levels,
        currentTier,
        nextTier,
        currentLevelIndex: levelIndex,
        progress: {
          current: row.progress?.current ?? 0,
          target: row.progress?.target ?? 0,
          percentage: row.progress?.percentage ?? 0,
        },
        isComplete,
        isEarned: isComplete,
        earnedAt: row.earnedAt,
        completedAt: row.completedAt,
        isActive: badge.isActive ?? true,
      };
    });
}
