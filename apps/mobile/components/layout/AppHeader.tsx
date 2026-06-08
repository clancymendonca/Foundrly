import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const { user, signIn } = useAuth();
  const pathname = usePathname();
  const hideNotifications = pathname.startsWith("/user/");

  return (
    <View className="flex-row items-center justify-between bg-white px-5 py-3 shadow-sm">
      <Link href="/">
        <Text className="text-xl font-bold text-primary">Foundrly</Text>
      </Link>

      <View className="flex-row items-center gap-4">
        {user ? (
          hideNotifications ? (
            <Link href={`/user/${user.id}/menu` as any} asChild>
              <Pressable className="p-2">
                <Ionicons name="menu" size={24} color="#000" />
              </Pressable>
            </Link>
          ) : (
            <Link href="/notifications" asChild>
              <Pressable className="p-2">
                <Ionicons name="notifications-outline" size={24} color="#000" />
              </Pressable>
            </Link>
          )
        ) : (
          <Pressable onPress={signIn} className="rounded-lg bg-gray-100 px-4 py-2">
            <Text className="font-medium text-primary">Login</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
