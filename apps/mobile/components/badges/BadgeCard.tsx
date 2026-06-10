import { StyleSheet, Text, View } from "react-native";
import { NeoCard } from "@/components/ui/NeoCard";
import {
  getBadgeIcon,
  getRarityConfig,
  getTierConfig,
  TIER_LIST,
  type LeveledBadge,
} from "@/lib/badges";
import { theme } from "@/lib/theme";

export type BadgeWithProgress = LeveledBadge;

function formatMetric(metric?: string) {
  if (!metric) return null;
  return metric.replace(/_/g, " ");
}

function formatCategory(category?: string) {
  if (!category) return null;
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function TierStepper({ badge }: { badge: LeveledBadge }) {
  const filledIndex = badge.currentLevelIndex;

  return (
    <View style={styles.stepper}>
      {TIER_LIST.map((tier, index) => {
        const config = getTierConfig(tier);
        const filled = index <= filledIndex;
        const isNext = badge.nextTier === tier && !badge.isComplete;
        return (
          <View
            key={tier}
            style={[
              styles.step,
              filled && { backgroundColor: config.borderColor },
              isNext && styles.stepNext,
              !filled && !isNext && styles.stepEmpty,
            ]}
          />
        );
      })}
    </View>
  );
}

export function BadgeCard({ badge }: { badge: LeveledBadge }) {
  const displayTier = badge.currentTier ?? badge.nextTier ?? "bronze";
  const tier = getTierConfig(displayTier);
  const levelDef =
    badge.levels.find((l) => l.tier === displayTier) ??
    badge.levels.find((l) => l.tier === badge.nextTier);
  const rarity = getRarityConfig(levelDef?.rarity);
  const inProgress = !badge.isComplete && badge.progress.percentage > 0;
  const levelLabel = badge.isComplete
    ? "Complete · Diamond"
    : badge.currentTier
      ? `Level ${badge.currentLevelIndex + 1}/5 · ${tier.label}`
      : "Not started";
  const metricLabel = formatMetric(badge.metric);
  const categoryLabel = formatCategory(badge.category);

  return (
    <NeoCard
      shadow="100"
      backgroundColor={
        badge.isComplete ? "#ECFDF5" : inProgress ? "#EFF6FF" : theme.white
      }
      borderRadius={12}
      style={styles.wrap}
      contentStyle={{
        ...styles.content,
        borderColor: badge.isComplete
          ? "#86EFAC"
          : inProgress
            ? "#93C5FD"
            : theme.gray200,
      }}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: tier.bgColor,
              borderColor: tier.borderColor,
            },
          ]}
        >
          <Text style={styles.icon}>{getBadgeIcon(badge)}</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {badge.name}
          </Text>
          <View style={styles.pills}>
            <View style={[styles.pill, { backgroundColor: rarity.bgColor }]}>
              <Text style={[styles.pillText, { color: rarity.color }]}>
                {rarity.label}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: tier.bgColor }]}>
              <Text style={[styles.pillText, { color: tier.color }]}>
                {tier.icon} {levelLabel}
              </Text>
            </View>
          </View>
        </View>

        {badge.isComplete ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>

      <TierStepper badge={badge} />

      <Text style={styles.description} numberOfLines={2}>
        {badge.description}
      </Text>

      {(categoryLabel || metricLabel) && (
        <Text style={styles.meta}>
          {[categoryLabel, metricLabel].filter(Boolean).join(" · ")}
        </Text>
      )}

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {badge.isComplete ? "Completed" : "Progress to next tier"}
        </Text>
        <Text style={styles.progressPct}>{badge.progress.percentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${badge.progress.percentage}%`,
              backgroundColor: badge.isComplete
                ? "#10B981"
                : inProgress
                  ? theme.primary
                  : theme.gray500,
            },
          ]}
        />
      </View>
      <Text style={styles.progressDetail}>
        {badge.progress.current} / {badge.progress.target}
      </Text>

      <Text style={styles.status}>
        {badge.isComplete
          ? `Completed${badge.completedAt ? ` on ${new Date(badge.completedAt).toLocaleDateString()}` : ""}`
          : badge.currentTier
            ? inProgress
              ? "Leveling up"
              : "Tier unlocked — keep going"
            : "Locked"}
      </Text>
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  content: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
  headerText: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.black,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 11,
  },
  checkmark: {
    fontSize: 20,
    color: "#059669",
    fontFamily: theme.fontFamily.bold,
  },
  stepper: {
    flexDirection: "row",
    gap: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  step: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.gray200,
  },
  stepEmpty: {
    backgroundColor: theme.gray200,
  },
  stepNext: {
    backgroundColor: theme.primary,
    opacity: 0.5,
  },
  description: {
    marginTop: 10,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: theme.gray600,
  },
  meta: {
    marginTop: 6,
    fontFamily: theme.fontFamily.medium,
    fontSize: 11,
    color: theme.gray500,
    textTransform: "capitalize",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  progressLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray600,
  },
  progressPct: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.gray700,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.gray200,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressDetail: {
    marginTop: 4,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.gray500,
  },
  status: {
    marginTop: 8,
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray600,
  },
});
