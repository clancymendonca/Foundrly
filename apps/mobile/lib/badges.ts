export const RARITY_LEVELS = {
  common: { bgColor: "#F3F4F6", color: "#6B7280", borderColor: "#D1D5DB" },
  uncommon: { bgColor: "#D1FAE5", color: "#059669", borderColor: "#34D399" },
  rare: { bgColor: "#DBEAFE", color: "#2563EB", borderColor: "#60A5FA" },
  epic: { bgColor: "#EDE9FE", color: "#7C3AED", borderColor: "#A78BFA" },
  legendary: { bgColor: "#FEE2E2", color: "#DC2626", borderColor: "#F87171" },
  mythical: { bgColor: "#FEF3C7", color: "#B45309", borderColor: "#FCD34D" },
} as const;

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
