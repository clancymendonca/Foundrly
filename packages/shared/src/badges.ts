export const RARITY_LEVELS = {
  common: {
    label: "Common",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  uncommon: {
    label: "Uncommon",
    color: "#059669",
    bgColor: "#D1FAE5",
    borderColor: "#34D399",
  },
  rare: {
    label: "Rare",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    borderColor: "#60A5FA",
  },
  epic: {
    label: "Epic",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    borderColor: "#A78BFA",
  },
  legendary: {
    label: "Legendary",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    borderColor: "#F87171",
  },
  mythical: {
    label: "Mythical",
    color: "#B45309",
    bgColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
} as const;

export const TIER_LEVELS = {
  bronze: {
    label: "Bronze",
    color: "#CD7F32",
    bgColor: "#FDF6EF",
    borderColor: "#CD7F32",
    icon: "🥉",
  },
  silver: {
    label: "Silver",
    color: "#64748B",
    bgColor: "#F8FAFC",
    borderColor: "#94A3B8",
    icon: "🥈",
  },
  gold: {
    label: "Gold",
    color: "#B45309",
    bgColor: "#FFFBEB",
    borderColor: "#FCD34D",
    icon: "🥇",
  },
  platinum: {
    label: "Platinum",
    color: "#475569",
    bgColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    icon: "💎",
  },
  diamond: {
    label: "Diamond",
    color: "#0891B2",
    bgColor: "#F0FDFF",
    borderColor: "#67E8F9",
    icon: "💠",
  },
} as const;

export const TIER_ORDER = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
} as const;

export const TIER_LIST = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
] as const;

export type BadgeRarity = keyof typeof RARITY_LEVELS;
export type BadgeTier = keyof typeof TIER_LEVELS;

export type BadgeLevel = {
  tier: BadgeTier;
  target: number;
  rarity: BadgeRarity;
  description?: string;
};

export type BadgeTrackDefinition = {
  name: string;
  description: string;
  category: "creator" | "community" | "social" | "achievement" | "special";
  icon: string;
  color: string;
  metric: string;
  levels: BadgeLevel[];
};

export type LeveledBadge = {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  metric: string;
  levels: BadgeLevel[];
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  currentLevelIndex: number;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  isComplete: boolean;
  isEarned: boolean;
  earnedAt?: string;
  completedAt?: string;
  isActive: boolean;
};

export type BadgeStats = {
  total: number;
  earned: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
};

const RARITY_SET = new Set<string>(Object.keys(RARITY_LEVELS));
const TIER_SET = new Set<string>(Object.keys(TIER_LEVELS));

export function normalizeRarity(value?: string | null): BadgeRarity {
  if (value && RARITY_SET.has(value)) return value as BadgeRarity;
  return "common";
}

export function normalizeTier(value?: string | null): BadgeTier {
  if (value && TIER_SET.has(value)) return value as BadgeTier;
  return "bronze";
}

export function getRarityConfig(rarity?: string | null) {
  return RARITY_LEVELS[normalizeRarity(rarity)];
}

export function getTierConfig(tier?: string | null) {
  return TIER_LEVELS[normalizeTier(tier)];
}

export function getNextTier(current: BadgeTier | null): BadgeTier | null {
  if (!current) return "bronze";
  const index = TIER_LIST.indexOf(current);
  if (index < 0 || index >= TIER_LIST.length - 1) return null;
  return TIER_LIST[index + 1];
}

export function isMaxTier(tier: BadgeTier | null): boolean {
  return tier === "diamond";
}

export function compareTiers(a: BadgeTier | null, b: BadgeTier | null): number {
  const aOrder = a ? TIER_ORDER[a] : 0;
  const bOrder = b ? TIER_ORDER[b] : 0;
  return aOrder - bOrder;
}

export function getTierLevelIndex(tier: BadgeTier | null): number {
  if (!tier) return -1;
  return TIER_LIST.indexOf(tier);
}

export function sortBadgeTracks<
  T extends { category?: string; name?: string; levels?: BadgeLevel[] },
>(badges: T[]): T[] {
  return [...badges].sort((a, b) => {
    const cat = (a.category ?? "").localeCompare(b.category ?? "");
    if (cat !== 0) return cat;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}

export type TrackProgressResult = {
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  currentLevelIndex: number;
  progress: { current: number; target: number; percentage: number };
  isComplete: boolean;
  currentLevelRarity: BadgeRarity;
};

export function calculateTrackProgress(
  metricValue: number,
  levels: BadgeLevel[],
): TrackProgressResult {
  const sorted = [...levels].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
  );

  let currentTier: BadgeTier | null = null;
  let currentLevelIndex = -1;

  for (let i = 0; i < sorted.length; i++) {
    if (metricValue >= sorted[i].target) {
      currentTier = sorted[i].tier;
      currentLevelIndex = i;
    } else {
      break;
    }
  }

  const maxLevel = sorted[sorted.length - 1];
  const isComplete =
    currentTier === "diamond" && metricValue >= maxLevel.target;

  if (isComplete) {
    const rarity = normalizeRarity(maxLevel.rarity);
    return {
      currentTier: "diamond",
      nextTier: null,
      currentLevelIndex: sorted.length - 1,
      progress: {
        current: metricValue,
        target: maxLevel.target,
        percentage: 100,
      },
      isComplete: true,
      currentLevelRarity: rarity,
    };
  }

  const nextIndex = currentLevelIndex + 1;
  const nextLevel = sorted[nextIndex];
  const prevTarget =
    currentLevelIndex >= 0 ? sorted[currentLevelIndex].target : 0;
  const nextTarget = nextLevel.target;
  const tierRange = nextTarget - prevTarget;
  const progressInTier = Math.max(0, metricValue - prevTarget);
  const percentage =
    tierRange > 0
      ? Math.min(Math.round((progressInTier / tierRange) * 100), 99)
      : 0;

  const displayRarity =
    currentLevelIndex >= 0
      ? normalizeRarity(sorted[currentLevelIndex].rarity)
      : normalizeRarity(nextLevel.rarity);

  return {
    currentTier,
    nextTier: nextLevel.tier,
    currentLevelIndex,
    progress: {
      current: metricValue,
      target: nextTarget,
      percentage,
    },
    isComplete: false,
    currentLevelRarity: displayRarity,
  };
}

export function selectProfileBadges(tracks: LeveledBadge[]): LeveledBadge[] {
  return tracks
    .filter((track) => track.currentTier != null)
    .sort((a, b) => compareTiers(b.currentTier, a.currentTier));
}

function level(
  tier: BadgeTier,
  target: number,
  rarity: BadgeRarity,
): BadgeLevel {
  return { tier, target, rarity };
}

/** Canonical badge catalog — one track per metric with name-appropriate thresholds. */
export const BADGE_CATALOG: BadgeTrackDefinition[] = [
  {
    name: "Startup Forge",
    description: "Build and publish startups on Foundrly",
    category: "creator",
    icon: "🚀",
    color: "#7C3AED",
    metric: "startups_created",
    levels: [
      level("bronze", 1, "common"),
      level("silver", 2, "uncommon"),
      level("gold", 5, "rare"),
      level("platinum", 10, "epic"),
      level("diamond", 20, "legendary"),
    ],
  },
  {
    name: "Community Voice",
    description: "Share thoughtful comments with the community",
    category: "community",
    icon: "💬",
    color: "#2563EB",
    metric: "comments_posted",
    levels: [
      level("bronze", 10, "common"),
      level("silver", 50, "uncommon"),
      level("gold", 200, "rare"),
      level("platinum", 750, "epic"),
      level("diamond", 2500, "mythical"),
    ],
  },
  {
    name: "Thread Weaver",
    description: "Keep conversations going with replies",
    category: "community",
    icon: "🧵",
    color: "#0891B2",
    metric: "replies_posted",
    levels: [
      level("bronze", 5, "common"),
      level("silver", 25, "uncommon"),
      level("gold", 100, "rare"),
      level("platinum", 400, "epic"),
      level("diamond", 1500, "mythical"),
    ],
  },
  {
    name: "Community Guardian",
    description: "Help keep Foundrly safe with valid reports",
    category: "community",
    icon: "🛡️",
    color: "#059669",
    metric: "reports_submitted",
    levels: [
      level("bronze", 1, "common"),
      level("silver", 3, "uncommon"),
      level("gold", 8, "rare"),
      level("platinum", 20, "epic"),
      level("diamond", 50, "legendary"),
    ],
  },
  {
    name: "Network Builder",
    description: "Follow founders and builders across the platform",
    category: "social",
    icon: "🤝",
    color: "#7C3AED",
    metric: "users_followed",
    levels: [
      level("bronze", 5, "common"),
      level("silver", 25, "uncommon"),
      level("gold", 100, "rare"),
      level("platinum", 300, "epic"),
      level("diamond", 750, "legendary"),
    ],
  },
  {
    name: "Rising Star",
    description: "Grow your audience and earn followers",
    category: "social",
    icon: "⭐",
    color: "#F59E0B",
    metric: "followers_gained",
    levels: [
      level("bronze", 3, "common"),
      level("silver", 15, "uncommon"),
      level("gold", 50, "rare"),
      level("platinum", 200, "epic"),
      level("diamond", 1000, "mythical"),
    ],
  },
  {
    name: "Crowd Favorite",
    description: "Receive likes on your startups",
    category: "social",
    icon: "❤️",
    color: "#DC2626",
    metric: "likes_received",
    levels: [
      level("bronze", 10, "common"),
      level("silver", 50, "uncommon"),
      level("gold", 250, "rare"),
      level("platinum", 1000, "epic"),
      level("diamond", 5000, "mythical"),
    ],
  },
  {
    name: "Spotlight",
    description: "Get your startups seen with views",
    category: "achievement",
    icon: "👀",
    color: "#6366F1",
    metric: "views_received",
    levels: [
      level("bronze", 100, "common"),
      level("silver", 500, "uncommon"),
      level("gold", 2500, "rare"),
      level("platinum", 10000, "epic"),
      level("diamond", 50000, "mythical"),
    ],
  },
  {
    name: "Steadfast",
    description: "Show up consistently across active days",
    category: "achievement",
    icon: "📅",
    color: "#475569",
    metric: "days_active",
    levels: [
      level("bronze", 7, "common"),
      level("silver", 30, "uncommon"),
      level("gold", 90, "rare"),
      level("platinum", 180, "epic"),
      level("diamond", 365, "legendary"),
    ],
  },
];
