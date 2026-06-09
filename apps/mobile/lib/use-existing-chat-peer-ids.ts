import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "./auth-context";
import { dedupeChannelsByMember, getOtherMemberId } from "./chat-utils";
import { useStreamChat } from "./stream-chat-context";

export function useExistingChatPeerIds() {
  const { user } = useAuth();
  const { client, status } = useStreamChat();
  const [peerIds, setPeerIds] = useState<string[]>([]);

  const loadPeerIds = useCallback(async () => {
    if (!client || !user?.id || status !== "ready") {
      setPeerIds([]);
      return;
    }

    const channels = await client.queryChannels(
      { members: { $in: [user.id] }, type: "messaging" },
      [{ last_message_at: -1 }],
      { state: true, limit: 100 },
    );

    const ids = dedupeChannelsByMember(channels, user.id)
      .map((ch) => getOtherMemberId(ch, user.id))
      .filter((id): id is string => !!id);

    setPeerIds(ids);
  }, [client, user?.id, status]);

  useEffect(() => {
    loadPeerIds();
  }, [loadPeerIds]);

  useFocusEffect(
    useCallback(() => {
      loadPeerIds();
    }, [loadPeerIds]),
  );

  return peerIds;
}
