import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  Chat,
  ChannelList,
  OverlayProvider,
} from "stream-chat-expo";
import { StreamChat } from "stream-chat";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { STREAM_API_KEY } from "@/lib/config";

export default function MessagesScreen() {
  const { user, signIn } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !STREAM_API_KEY) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const chatClient = StreamChat.getInstance(STREAM_API_KEY);
        const { token } = await apiFetch<{ token: string }>("/api/chat/token", {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });
        await chatClient.connectUser(
          { id: user.id, name: user.name || user.id, image: user.image || undefined },
          token,
        );
        setClient(chatClient);
      } catch (e) {
        console.error("Stream connect error", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      client?.disconnectUser();
    };
  }, [user?.id]);

  if (!user) {
    return (
      <AppShell>
        <MobilePageHeader title="Messages" />
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator color="#4E71FF" />
        </View>
      </AppShell>
    );
  }

  if (loading || !client) {
    return (
      <AppShell>
        <MobilePageHeader title="Messages" />
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title="Messages" />
      <View className="flex-1 pb-20">
        <OverlayProvider>
          <Chat client={client as any}>
            <ChannelList />
          </Chat>
        </OverlayProvider>
      </View>
    </AppShell>
  );
}
