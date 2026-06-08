import { Link, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/auth-context";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

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
      <View style={screenStyles.scrollContent}>
        {MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </Link>
        ))}
        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
    paddingVertical: 16,
  },
  menuLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  logoutBtn: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
  },
  logoutText: {
    textAlign: "center",
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.red600,
  },
});
