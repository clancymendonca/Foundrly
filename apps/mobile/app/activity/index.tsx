import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { screenStyles } from "@/lib/screen-styles";

const SECTIONS = [
  { href: "/activity/interactions", label: "Interactions", desc: "Likes, dislikes, comments" },
  { href: "/activity/account-history", label: "Account history", desc: "Account changes" },
];

export default function ActivityHubScreen() {
  return (
    <AppShell>
      <MobilePageHeader title="Your Activity" />
      <View style={screenStyles.scrollContent}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href as any} asChild>
            <Pressable style={[screenStyles.card, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
              <View>
                <Text style={screenStyles.cardTitle}>{s.label}</Text>
                <Text style={screenStyles.cardDesc}>{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
      </View>
    </AppShell>
  );
}
