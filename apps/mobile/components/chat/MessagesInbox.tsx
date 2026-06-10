import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Channel } from "stream-chat";
import type { Message } from "@foundrly/shared";
import { ChatBanMessage } from "./ChatBanMessage";
import { MessageListItem } from "./MessageListItem";
import { SuggestedUsersList } from "./SuggestedUsersList";
import { useAuth } from "@/lib/auth-context";
import { channelsToMessages, dedupeChannelsByMember } from "@/lib/chat-utils";
import {
  openMessageThread,
  openNewMessage,
} from "@/lib/channel-routing";
import { useStreamChat } from "@/lib/stream-chat-context";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export function MessagesInbox() {
  const { user, signIn } = useAuth();
  const { client, status, error, banDescription, retry } = useStreamChat();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const channelsRef = useRef<Channel[]>([]);
  const listenersRef = useRef<Array<{ channel: Channel; handler: () => void }>>(
    [],
  );

  const updateFromChannels = useCallback(
    async (channels: Channel[]) => {
      if (!user?.id) return;
      const items = await channelsToMessages(channels, user.id);
      setMessages(items);
    },
    [user?.id],
  );

  const loadChannels = useCallback(async () => {
    if (!client || !user?.id) return;

    const filters = { members: { $in: [user.id] }, type: "messaging" as const };
    const sort = [{ last_message_at: -1 as const }];
    const userChannels = await client.queryChannels(filters, sort, {
      watch: true,
      state: true,
      limit: 30,
    });

    listenersRef.current.forEach(({ channel, handler }) => {
      channel.off("message.new", handler);
      channel.off("message.read", handler);
    });
    listenersRef.current = [];

    const handler = () => updateFromChannels(channelsRef.current);

    userChannels.forEach((ch) => {
      ch.on("message.new", handler);
      ch.on("message.read", handler);
      listenersRef.current.push({ channel: ch, handler });
    });

    channelsRef.current = dedupeChannelsByMember(userChannels, user.id);
    updateFromChannels(channelsRef.current);
  }, [client, user?.id, updateFromChannels]);

  useEffect(() => {
    if (status !== "ready" || !client) return;
    loadChannels();
    return () => {
      listenersRef.current.forEach(({ channel, handler }) => {
        channel.off("message.new", handler);
        channel.off("message.read", handler);
      });
      listenersRef.current = [];
    };
  }, [status, client, loadChannels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadChannels();
    } finally {
      setRefreshing(false);
    }
  }, [loadChannels]);

  const handleSelectChat = (id: string) => {
    openMessageThread(router, id);
  };

  const handleNewMessage = () => {
    openNewMessage(router);
  };

  const totalUnread = messages.reduce(
    (sum, msg) => sum + (msg.unreadCount || 0),
    0,
  );

  const isBanned = status === "banned";

  if (!user) {
    return (
      <View style={screenStyles.center}>
        <Text style={styles.signInText}>Sign in to view messages</Text>
        <Pressable onPress={signIn} style={screenStyles.primaryBtn}>
          <Text style={screenStyles.primaryBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (status === "offline") {
    return (
      <View style={screenStyles.center}>
        <Text style={styles.errorText}>You are offline</Text>
        <Pressable onPress={retry} style={screenStyles.primaryBtn}>
          <Text style={screenStyles.primaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <View style={screenStyles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={screenStyles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={retry} style={screenStyles.primaryBtn}>
          <Text style={screenStyles.primaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isBanned && banDescription && (
        <ChatBanMessage
          description={banDescription}
          isPermanent={banDescription.includes("permanent")}
        />
      )}

      {totalUnread > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {isBanned ? (
        <View style={[styles.newMessageRow, styles.newMessageDisabled]}>
          <View style={[styles.composeBtn, styles.composeBtnDisabled]}>
            <Ionicons name="create-outline" size={24} color={theme.gray500} />
          </View>
          <Text style={styles.newMessageDisabledText}>
            New message (disabled)
          </Text>
        </View>
      ) : (
        <Pressable onPress={handleNewMessage} style={styles.newMessageRow}>
          <View style={styles.composeBtn}>
            <Ionicons name="create-outline" size={24} color={theme.white} />
          </View>
          <Text style={styles.newMessageText}>New message</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Messages</Text>
      {messages.length === 0 ? (
        <Text style={styles.empty}>No conversations yet</Text>
      ) : (
        messages.map((msg) => (
          <MessageListItem
            key={msg.id}
            item={msg}
            onSelect={handleSelectChat}
          />
        ))
      )}

      <Text style={[styles.sectionTitle, styles.suggestedTitle]}>
        Suggested
      </Text>
      {!isBanned && (
        <SuggestedUsersList
          maxResults={5}
          onStartChat={(channelId) => openMessageThread(router, channelId)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  signInText: {
    marginBottom: 16,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.gray600,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.red600,
    paddingHorizontal: 24,
  },
  unreadBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unreadBannerText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 13,
    color: theme.blue500,
    textAlign: "center",
  },
  newMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  newMessageDisabled: { opacity: 0.5 },
  composeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  composeBtnDisabled: { backgroundColor: theme.gray200 },
  newMessageText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.black,
  },
  newMessageDisabledText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.gray500,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.gray600,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  suggestedTitle: { marginTop: 16 },
  empty: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    paddingVertical: 24,
  },
});
