import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import {
  getBadgeIcon,
  getRarityConfig,
  getTierConfig,
  type LeveledBadge,
} from "@/lib/badges";
import { theme } from "@/lib/theme";

export function BadgeLabels({
  badges,
  maxDisplay = 6,
  userId,
}: {
  badges: LeveledBadge[];
  maxDisplay?: number;
  userId?: string;
}) {
  const router = useRouter();

  if (!badges.length) return null;

  const display = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;

  const openBadges = () => {
    if (!userId) return;
    router.push(`/badges?user=${userId}` as never);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {display.map((badge) => {
        const tier = getTierConfig(badge.currentTier);
        const levelDef = badge.levels.find((l) => l.tier === badge.currentTier);
        const rarity = getRarityConfig(levelDef?.rarity);
        return (
          <Pressable
            key={badge._id}
            onPress={openBadges}
            disabled={!userId}
            style={[
              styles.chip,
              {
                backgroundColor: rarity.bgColor,
                borderColor: rarity.borderColor,
              },
            ]}
          >
            <Text style={styles.emoji}>
              {tier.icon} {getBadgeIcon(badge)}
            </Text>
            <Text style={[styles.name, { color: rarity.color }]} numberOfLines={1}>
              {badge.name}
            </Text>
          </Pressable>
        );
      })}
      {hasMore && (
        <Pressable
          onPress={openBadges}
          disabled={!userId}
          style={styles.moreChip}
        >
          <Text style={styles.moreText}>View More</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { width: "100%", marginTop: 16 },
  row: { gap: 8, paddingVertical: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
  },
  emoji: { fontSize: 14 },
  name: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    maxWidth: 120,
  },
  moreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.gray200,
    backgroundColor: theme.gray100,
  },
  moreText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray600,
  },
});
