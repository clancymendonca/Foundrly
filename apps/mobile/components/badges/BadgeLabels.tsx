import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getCategoryIcon, RARITY_LEVELS } from "@/lib/badges";
import { theme } from "@/lib/theme";

type Badge = {
  _id?: string;
  name?: string;
  description?: string;
  category?: string;
  rarity?: keyof typeof RARITY_LEVELS;
};

export function BadgeLabels({
  badges,
  maxDisplay = 6,
}: {
  badges: Badge[];
  maxDisplay?: number;
}) {
  if (!badges.length) return null;

  const display = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {display.map((badge) => {
        const rarity =
          RARITY_LEVELS[badge.rarity ?? "common"] ?? RARITY_LEVELS.common;
        return (
          <View
            key={badge._id ?? badge.name}
            style={[
              styles.chip,
              {
                backgroundColor: rarity.bgColor,
                borderColor: rarity.borderColor,
              },
            ]}
          >
            <Text style={styles.emoji}>{getCategoryIcon(badge.category)}</Text>
            <Text style={[styles.name, { color: rarity.color }]} numberOfLines={1}>
              {badge.name}
            </Text>
          </View>
        );
      })}
      {hasMore && (
        <View style={styles.moreChip}>
          <Text style={styles.moreText}>View More</Text>
        </View>
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
    borderWidth: 4,
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
    borderWidth: 4,
    borderColor: theme.gray200,
    backgroundColor: theme.gray100,
  },
  moreText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray600,
  },
});
