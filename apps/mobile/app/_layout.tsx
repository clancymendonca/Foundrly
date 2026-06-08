import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { AuthProvider } from "@/lib/auth-context";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="startup/[id]" />
          <Stack.Screen name="startup/create" />
          <Stack.Screen name="startup/[id]/edit" />
          <Stack.Screen name="messages" />
          <Stack.Screen name="badges" />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="user/[id]/index" />
          <Stack.Screen name="user/[id]/menu" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="activity/index" />
          <Stack.Screen name="activity/interactions" />
          <Stack.Screen name="activity/account-history" />
          <Stack.Screen name="analytics/index" />
          <Stack.Screen name="saved/index" />
          <Stack.Screen name="interested/index" />
        </Stack>
        <Toast />
      </AuthProvider>
    </QueryClientProvider>
  );
}
