import { Link, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/auth-context";

const MENU_ITEMS = [
  { href: "/settings", label: "Settings" },
  { href: "/activity", label: "Your activity" },
  { href: "/analytics", label: "Analytics" },
  { href: "/saved", label: "Saved" },
  { href: "/interested", label: "Interested" },
];

export default function UserMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { signOut } = useAuth();

  return (
    <AppShell>
      <MobilePageHeader title="Menu" backHref={`/user/${id}`} />
      <View className="p-4 pb-24">
        {MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <Pressable className="flex-row items-center justify-between border-b border-gray-100 py-4">
              <Text className="text-base">{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
        <Pressable onPress={signOut} className="mt-6 rounded-lg bg-red-50 py-4">
          <Text className="text-center font-medium text-red-600">Logout</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}
