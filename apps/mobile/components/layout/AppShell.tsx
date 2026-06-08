import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "./AppHeader";
import { MobileTabBar } from "./MobileTabBar";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <AppHeader />
      <View className={`flex-1 ${user ? "pb-20" : ""}`}>{children}</View>
      <MobileTabBar />
    </SafeAreaView>
  );
}
