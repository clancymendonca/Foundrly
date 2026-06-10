import type { LeveledBadge } from "@/lib/badges";

export type StatusFilter = "all" | "complete" | "in_progress" | "locked";

export function filterBadges(
  badges: LeveledBadge[],
  statusFilter: StatusFilter,
  tierFilter: string | null,
): LeveledBadge[] {
  let filtered = badges;

  switch (statusFilter) {
    case "complete":
      filtered = filtered.filter((b) => b.isComplete);
      break;
    case "in_progress":
      filtered = filtered.filter(
        (b) => !b.isComplete && (b.currentTier != null || b.progress.percentage > 0),
      );
      break;
    case "locked":
      filtered = filtered.filter(
        (b) => !b.isComplete && b.currentTier == null && b.progress.percentage === 0,
      );
      break;
    default:
      break;
  }

  if (tierFilter && tierFilter !== "all") {
    filtered = filtered.filter((b) => b.currentTier === tierFilter);
  }

  return filtered;
}
