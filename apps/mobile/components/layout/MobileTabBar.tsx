import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export function MobileTabBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const tabs: {
    href: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { href: "/startup/create", label: "Create", icon: "add-circle-outline" },
    { href: "/messages", label: "Messages", icon: "chatbubble-outline" },
    { href: `/badges?user=${user.id}`, label: "Badges", icon: "trophy-outline" },
    { href: "/leaderboard", label: "Leaders", icon: "ribbon-outline" },
    { href: `/user/${user.id}`, label: "You", icon: "person-outline" },
  ];

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const base = tab.href.split("?")[0];
        const active = pathname === tab.href || pathname.startsWith(base);
        const isProfile = tab.label === "You";

        return (
          <Link key={tab.href} href={tab.href as any} asChild>
            <Pressable style={styles.tab}>
              {isProfile ? (
                user.image ? (
                  <Image source={{ uri: user.image }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {user.name?.[0] || "U"}
                    </Text>
                  </View>
                )
              ) : (
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={active ? theme.primary : theme.black100}
                />
              )}
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: theme.tabBarHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: theme.fontFamily.regular,
    color: theme.black100,
  },
  labelActive: { color: theme.primary },
  avatar: { height: 24, width: 24, borderRadius: 12 },
  avatarFallback: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
    color: theme.white,
  },
});
