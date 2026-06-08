import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@foundrly/shared";

export function MobileTabBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const tabs: {
    href: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap | null;
  }[] = [
    { href: "/startup/create", label: "Create", icon: "add-circle-outline" },
    { href: "/messages", label: "Messages", icon: "chatbubble-outline" },
    { href: `/badges?user=${user.id}`, label: "Badges", icon: "trophy-outline" },
    { href: "/leaderboard", label: "Leaders", icon: "ribbon-outline" },
    { href: `/user/${user.id}`, label: "You", icon: null },
  ];

  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-gray-200 bg-white px-4 py-2"
      style={{ height: colors ? 72 : 72 }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href.split("?")[0]);
        return (
          <Link key={tab.href} href={tab.href as any} asChild>
            <Pressable className="flex-1 items-center py-2">
              {tab.icon ? (
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={active ? "#4E71FF" : "#333"}
                />
              ) : user.image ? (
                <Image
                  source={{ uri: user.image }}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Text className="text-xs text-white">
                    {user.name?.[0] || "U"}
                  </Text>
                </View>
              )}
              <Text
                className={`mt-1 text-xs ${active ? "text-primary" : "text-gray-600"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}
