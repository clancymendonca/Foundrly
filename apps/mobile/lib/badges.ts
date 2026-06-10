export {
  RARITY_LEVELS,
  TIER_LEVELS,
  TIER_ORDER,
  TIER_LIST,
  getRarityConfig,
  getTierConfig,
  normalizeRarity,
  normalizeTier,
  selectProfileBadges,
  type BadgeRarity,
  type BadgeTier,
  type LeveledBadge,
} from "@foundrly/shared/badges";

import type { LeveledBadge } from "@foundrly/shared/badges";

export function getCategoryIcon(category?: string) {
  switch (category) {
    case "creator":
      return "🚀";
    case "community":
      return "🤝";
    case "social":
      return "💬";
    case "achievement":
      return "🏆";
    case "special":
      return "⭐";
    default:
      return "🏅";
  }
}

export function getBadgeIcon(badge: { icon?: string; category?: string }) {
  return badge.icon || getCategoryIcon(badge.category);
}
