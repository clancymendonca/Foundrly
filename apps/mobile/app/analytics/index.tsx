import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

const SECTIONS = [
  { href: "/analytics?section=startup-analytics", label: "Startup analytics" },
  { href: "/analytics?section=engagement-audience", label: "Engagement & audience" },
];

export default function AnalyticsHubScreen() {
  return (
    <AppShell>
      <MobilePageHeader title="Analytics" />
      <View style={screenStyles.scrollContent}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href as any} asChild>
            <Pressable style={[screenStyles.card, styles.row]}>
              <Text style={screenStyles.cardTitle}>{s.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
        <Text style={styles.note}>
          Detailed charts available in a future update (victory-native)
        </Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  note: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
  },
});
