import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";

const SECTIONS = [
  { href: "/activity/interactions", label: "Interactions", desc: "Likes, dislikes, comments" },
  { href: "/activity/account-history", label: "Account history", desc: "Account changes" },
];

export default function ActivityHubScreen() {
  return (
    <AppShell>
      <MobilePageHeader title="Your Activity" />
      <View className="p-4 pb-24">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href as any} asChild>
            <Pressable className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-100 p-4">
              <View>
                <Text className="font-semibold">{s.label}</Text>
                <Text className="text-sm text-gray-500">{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
      </View>
    </AppShell>
  );
}
