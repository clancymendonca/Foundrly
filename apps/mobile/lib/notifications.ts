import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const existing = (await Notifications.getPermissionsAsync()) as {
      granted?: boolean;
      status?: string;
    };

    if (!existing.granted && existing.status !== "granted") {
      const requested = (await Notifications.requestPermissionsAsync()) as {
        granted?: boolean;
        status?: string;
      };
      if (!requested.granted && requested.status !== "granted") {
        return null;
      }
    }

    const projectId = getExpoProjectId();
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResult.data;

    try {
      await apiFetch("/api/push-notifications/send", {
        method: "POST",
        body: JSON.stringify({ expoPushToken: token }),
      });
    } catch {
      // Registration endpoint may vary; token obtained for future use
    }

    return token;
  } catch {
    // FCM/google-services.json not configured — skip push on local dev builds
    return null;
  }
}
