import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "./AppHeader";
import { MobileTabBar } from "./MobileTabBar";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader />
      <View style={[styles.content, user ? styles.contentWithTabs : null]}>
        {children}
      </View>
      <MobileTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.white },
  content: { flex: 1 },
  contentWithTabs: { paddingBottom: theme.tabBarHeight },
});
