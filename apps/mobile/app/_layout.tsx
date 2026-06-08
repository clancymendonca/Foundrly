import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Toast from "react-native-toast-message";
import { AuthProvider } from "@/lib/auth-context";
import { StreamChatProvider } from "@/lib/stream-chat-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "WorkSans-Regular": require("../assets/fonts/WorkSans-Regular.ttf"),
    "WorkSans-Medium": require("../assets/fonts/WorkSans-Medium.ttf"),
    "WorkSans-SemiBold": require("../assets/fonts/WorkSans-SemiBold.ttf"),
    "WorkSans-Bold": require("../assets/fonts/WorkSans-Bold.ttf"),
    "WorkSans-ExtraBold": require("../assets/fonts/WorkSans-ExtraBold.ttf"),
    "WorkSans-Black": require("../assets/fonts/WorkSans-Black.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StreamChatProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.root }}>
            <Stack.Screen name="github-callback" options={{ headerShown: false }} />
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
          </StreamChatProvider>
        </AuthProvider>
      </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
