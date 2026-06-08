import { Link, usePathname } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export function AppHeader() {
  const { user, signIn } = useAuth();
  const pathname = usePathname();
  const hideNotifications = pathname.startsWith("/user/");

  return (
    <View style={styles.header}>
      <Link href="/" asChild>
        <Pressable>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Pressable>
      </Link>

      <View style={styles.actions}>
        {user ? (
          hideNotifications ? (
            <Link href={`/user/${user.id}/menu` as any} asChild>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="menu" size={24} color={theme.black} />
              </Pressable>
            </Link>
          ) : (
            <Link href="/notifications" asChild>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={24} color={theme.black} />
              </Pressable>
            </Link>
          )
        ) : (
          <Pressable onPress={signIn} style={styles.loginBtn}>
            <Text style={styles.loginText}>Login</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: { width: 144, height: 30 },
  actions: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconBtn: { padding: 8, borderRadius: 8 },
  loginBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
  },
});
