import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";

const SECTIONS = [
  { href: "/analytics?section=startup-analytics", label: "Startup analytics" },
  { href: "/analytics?section=engagement-audience", label: "Engagement & audience" },
];

export default function AnalyticsHubScreen() {
  return (
    <AppShell>
      <MobilePageHeader title="Analytics" />
      <View className="p-4 pb-24">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href as any} asChild>
            <Pressable className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-100 p-4">
              <Text className="font-semibold">{s.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
        <Text className="mt-4 text-center text-sm text-gray-500">
          Detailed charts available in a future update (victory-native)
        </Text>
      </View>
    </AppShell>
  );
}
