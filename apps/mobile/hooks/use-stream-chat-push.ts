import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { StreamChat } from "stream-chat";
import { openMessageThread } from "@/lib/channel-routing";
import { registerForPushNotifications } from "@/lib/notifications";
import { apiFetch } from "@/lib/api-client";

function extractChannelId(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const cid = data.cid ?? data.channel_id ?? data.channelId;
  if (typeof cid === "string") {
    return cid.includes(":") ? cid.split(":")[1] : cid;
  }

  return null;
}

export function useStreamChatPush(
  client: StreamChat | null,
  userId: string | undefined,
  enabled: boolean,
) {
  const router = useRouter();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!client || !userId || !enabled || registeredRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (!token || cancelled) return;

        try {
          await client.addDevice(token, "firebase", userId);
          registeredRef.current = true;
        } catch {
          try {
            await apiFetch("/api/chat/register-device", {
              method: "POST",
              body: JSON.stringify({
                userId,
                deviceToken: token,
                provider: "firebase",
              }),
            });
            registeredRef.current = true;
          } catch {
            // Push registration is best-effort on mobile dev builds
          }
        }
      } catch {
        // Missing FCM credentials or permissions — safe to ignore locally
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [client, userId, enabled]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const channelId = extractChannelId(
          response.notification.request.content.data as
            | Record<string, unknown>
            | undefined,
        );
        if (channelId) {
          openMessageThread(router, channelId);
        }
      },
    );

    return () => sub.remove();
  }, [router]);
}
