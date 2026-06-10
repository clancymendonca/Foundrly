import { StyleSheet, Text, View } from "react-native";
import { NeoCard } from "@/components/ui/NeoCard";
import { theme } from "@/lib/theme";

export type BadgeStats = {
  total: number;
  earned: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
};

export function BadgesStatsHeader({ stats }: { stats: BadgeStats }) {
  return (
    <NeoCard
      shadow="100"
      backgroundColor={theme.primary}
      borderRadius={16}
      style={styles.wrap}
      contentStyle={styles.content}
    >
      <Text style={styles.title}>Track your achievements</Text>
      <Text style={styles.subtitle}>
        {stats.earned} of {stats.total} tracks complete (diamond)
      </Text>

      <View style={styles.grid}>
        <StatCell label="Tracks" value={stats.total} />
        <StatCell label="Complete" value={stats.earned} />
        <StatCell label="In progress" value={stats.inProgress} />
        <StatCell label="Completion" value={`${stats.completionRate}%`} />
      </View>
    </NeoCard>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  content: { padding: 16, borderRadius: 16 },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.white,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  cell: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  value: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.white,
  },
  label: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
});
