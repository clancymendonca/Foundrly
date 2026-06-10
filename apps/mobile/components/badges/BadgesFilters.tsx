import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TIER_LEVELS, type BadgeTier } from "@/lib/badges";
import type { StatusFilter } from "@/lib/badge-filters";
import { theme } from "@/lib/theme";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "complete", label: "Complete" },
  { value: "in_progress", label: "In progress" },
  { value: "locked", label: "Locked" },
];

const TIER_OPTIONS: { value: BadgeTier | "all"; label: string }[] = [
  { value: "all", label: "Any tier" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
];

export function BadgesFilters({
  statusFilter,
  onStatusFilterChange,
  tierFilter,
  onTierFilterChange,
}: {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  tierFilter: BadgeTier | "all";
  onTierFilterChange: (value: BadgeTier | "all") => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {STATUS_OPTIONS.map((option) => {
          const active = statusFilter === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onStatusFilterChange(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TIER_OPTIONS.map((option) => {
          const active = tierFilter === option.value;
          const tierStyle =
            option.value !== "all" ? TIER_LEVELS[option.value] : null;

          return (
            <Pressable
              key={option.value}
              onPress={() => onTierFilterChange(option.value)}
              style={[
                styles.chip,
                active && styles.chipActive,
                tierStyle && active
                  ? {
                      backgroundColor: tierStyle.bgColor,
                      borderColor: tierStyle.borderColor,
                    }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  tierStyle && active ? { color: tierStyle.color } : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, gap: 10 },
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.gray200,
    backgroundColor: theme.white,
  },
  chipActive: {
    borderColor: theme.primary,
    backgroundColor: "rgba(78, 113, 255, 0.1)",
  },
  chipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 13,
    color: theme.gray600,
  },
  chipTextActive: {
    fontFamily: theme.fontFamily.bold,
    color: theme.primary,
  },
});
