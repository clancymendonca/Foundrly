import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel, Event, LocalMessage, StreamChat } from "stream-chat";
import Toast from "react-native-toast-message";
import { apiFetch } from "@/lib/api-client";
import { watchMessagingChannel } from "@/lib/channel-routing";

const PAGE_SIZE = 25;

const CHANNEL_EVENT_TYPES = [
  "message.new",
  "message.updated",
  "message.deleted",
  "reaction.new",
  "reaction.deleted",
  "message.read",
  "typing.start",
  "typing.stop",
  "user.presence.changed",
] as const;

export function useChannelMessages(
  client: StreamChat | null,
  userId: string | undefined,
  channelId: string,
  status: string,
) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [readRevision, setReadRevision] = useState(0);
  const unsubRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  const syncMessages = useCallback((ch: Channel) => {
    setMessages([...ch.state.messages]);
  }, []);

  useEffect(() => {
    if (!client || !userId || !channelId || status !== "ready") return;

    let channelInstance: Channel | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      setHasMore(true);

      try {
        let resolvedChannelId = channelId;

        try {
          channelInstance = await watchMessagingChannel(
            client,
            userId,
            resolvedChannelId,
          );
        } catch {
          const ensured = await apiFetch<{ channelId: string }>(
            "/api/chat/ensure-channel-access",
            {
              method: "POST",
              body: JSON.stringify({ channelId: resolvedChannelId }),
            },
          );
          resolvedChannelId = ensured.channelId;
          channelInstance = await watchMessagingChannel(
            client,
            userId,
            resolvedChannelId,
          );
        }

        if (cancelled) return;

        if (Object.keys(channelInstance.state.members ?? {}).length < 2) {
          await channelInstance.query({ members: { limit: 10 } });
        }

        setChannel(channelInstance);
        syncMessages(channelInstance);
        setHasMore(channelInstance.state.messages.length >= PAGE_SIZE);
        await channelInstance.markRead();

        const refresh = () => syncMessages(channelInstance!);
        const refreshRead = () => {
          refresh();
          setReadRevision((value) => value + 1);
        };

        unsubRef.current = CHANNEL_EVENT_TYPES.map((eventType) =>
          channelInstance!.on(eventType, (event: Event) => {
            if (eventType === "message.read") {
              refreshRead();
            } else {
              refresh();
            }
            if (eventType === "message.new") {
              channelInstance?.markRead().catch(() => {});
            }
          }),
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load chat";
        setLoadError(message);
        Toast.show({ type: "error", text1: message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubRef.current.forEach((sub) => sub.unsubscribe());
      unsubRef.current = [];
      if (channelInstance) {
        channelInstance.stopWatching().catch(() => {});
      }
    };
  }, [client, userId, channelId, status, syncMessages]);

  const loadEarlier = useCallback(async () => {
    if (!channel || loadingEarlier || !hasMore || messages.length === 0) {
      return;
    }

    const oldest = messages[0];
    if (!oldest?.id) return;

    setLoadingEarlier(true);
    try {
      const response = await channel.query({
        messages: { limit: PAGE_SIZE, id_lt: oldest.id },
      });
      const fetched = response.messages ?? [];
      setHasMore(fetched.length >= PAGE_SIZE);
      syncMessages(channel);
    } catch {
      Toast.show({ type: "error", text1: "Could not load earlier messages" });
    } finally {
      setLoadingEarlier(false);
    }
  }, [channel, loadingEarlier, hasMore, messages, syncMessages]);

  return {
    channel,
    messages,
    loading,
    loadError,
    loadingEarlier,
    hasMore,
    loadEarlier,
    syncMessages,
    readRevision,
  };
}
