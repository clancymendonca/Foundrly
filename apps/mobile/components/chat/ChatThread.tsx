import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Channel, LocalMessage } from "stream-chat";
import Toast from "react-native-toast-message";
import { ChatAvatar } from "./ChatAvatar";
import { ChatBanMessage } from "./ChatBanMessage";
import { ChatScrollView } from "./ChatScrollView";
import {
  EMOJI_REACTIONS,
  EMOJI_TO_REACTION_TYPE,
  REACTION_TYPE_TO_EMOJI,
} from "./reactions";
import { apiFetch } from "@/lib/api-client";
import {
  fetchChatProfile,
  getChannelOtherUser,
  getMessageUserId,
  getOtherMemberId,
  type ChatProfile,
} from "@/lib/chat-utils";
import { watchMessagingChannel } from "@/lib/channel-routing";
import { useAuth } from "@/lib/auth-context";
import { useStreamChat } from "@/lib/stream-chat-context";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

interface ChatThreadProps {
  channelId: string;
}

/** FlatList omits renderScrollComponent in RN 0.85 types but VirtualizedList still supports it. */
type ChatFlatListProps = React.ComponentProps<typeof FlatList<LocalMessage>> & {
  renderScrollComponent?: (props: ScrollViewProps) => React.ReactElement;
};

const BASE_FOOTER_HEIGHT = 60;

export function ChatThread({ channelId }: ChatThreadProps) {
  const { user } = useAuth();
  const { client, status, banDescription } = useStreamChat();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ChatProfile | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<
    string | null
  >(null);
  const listRef = useRef<FlatList<LocalMessage>>(null);
  const unsubRef = useRef<Array<{ unsubscribe: () => void }>>([]);
  const insets = useSafeAreaInsets();
  const extraContentPadding = useSharedValue(0);

  const scrollToLatest = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const onFooterLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      extraContentPadding.value = withTiming(
        Math.max(height - BASE_FOOTER_HEIGHT, 0),
        { duration: 250 },
      );
    },
    [extraContentPadding],
  );

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView {...props} extraContentPadding={extraContentPadding} />
    ),
    [extraContentPadding],
  );

  const isBanned = status === "banned";

  const syncMessages = useCallback((ch: Channel) => {
    setMessages([...ch.state.messages]);
  }, []);

  useEffect(() => {
    if (!client || !user?.id || !channelId || status !== "ready") return;

    let channelInstance: Channel | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let resolvedChannelId = channelId;

        try {
          channelInstance = await watchMessagingChannel(
            client,
            user.id,
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
            user.id,
            resolvedChannelId,
          );
        }

        if (cancelled) return;

        setChannel(channelInstance);
        if (Object.keys(channelInstance.state.members ?? {}).length < 2) {
          await channelInstance.query({ members: { limit: 10 } });
        }
        syncMessages(channelInstance);
        await channelInstance.markRead();

        const refresh = () => {
          syncMessages(channelInstance!);
        };

        const eventTypes = [
          "message.new",
          "message.updated",
          "reaction.new",
          "reaction.deleted",
        ] as const;

        unsubRef.current = eventTypes.map((eventType) =>
          channelInstance!.on(eventType, () => {
            refresh();
            if (eventType === "message.new") {
              channelInstance?.markRead().catch(() => {});
            }
          }),
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load chat";
        setLoadError(message);
        Toast.show({
          type: "error",
          text1: message,
        });
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
  }, [client, user?.id, channelId, status, syncMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const otherUser = channel
    ? getChannelOtherUser(channel, user?.id ?? "", messages)
    : null;
  const otherUserImage =
    otherProfile?.imageUrl ?? otherUser?.image;
  const otherUserName =
    otherProfile?.name ?? otherUser?.name ?? otherUser?.id ?? "Chat";

  useEffect(() => {
    if (!channel || !user?.id) {
      setOtherProfile(null);
      return;
    }

    const otherId = getOtherMemberId(channel, user.id);
    if (!otherId) return;

    let cancelled = false;
    fetchChatProfile(otherId).then((profile) => {
      if (!cancelled) setOtherProfile(profile);
    });

    return () => {
      cancelled = true;
    };
  }, [channel, user?.id, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || !channel || sending || isBanned) return;

    setSending(true);
    try {
      const data = await apiFetch<{ result?: { isFlagged?: boolean; reason?: string } }>(
        "/api/moderation/check",
        {
          method: "POST",
          body: JSON.stringify({ content: input }),
        },
      );

      if (data.result?.isFlagged) {
        Toast.show({
          type: "error",
          text1: "Message flagged",
          text2:
            data.result.reason ||
            "Your message may violate community guidelines.",
        });
        return;
      }

      await channel.sendMessage({ text: input.trim() });
      setInput("");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e instanceof Error ? e.message : "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (msg: LocalMessage, emoji: string) => {
    if (!channel || !user?.id) return;
    const reactionType = EMOJI_TO_REACTION_TYPE[emoji];
    if (!reactionType) return;

    const userReaction = (msg.own_reactions || []).find(
      (r) => r.user_id === user.id && r.type === reactionType,
    );

    if (userReaction) {
      await channel.deleteReaction(msg.id, reactionType);
    } else {
      await channel.sendReaction(msg.id, { type: reactionType });
    }
    setActiveReactionMessageId(null);
  };

  const getTopReaction = (msg: LocalMessage) => {
    const reactions = msg.latest_reactions || [];
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      const emoji = REACTION_TYPE_TO_EMOJI[r.type];
      if (emoji) counts[emoji] = (counts[emoji] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  const renderMessage = ({
    item: msg,
    index,
  }: {
    item: LocalMessage;
    index: number;
  }) => {
    const messageUserId = getMessageUserId(msg);
    const isOutgoing = messageUserId === user?.id;
    const topReaction = getTopReaction(msg);
    const nextUserId = messages[index + 1]
      ? getMessageUserId(messages[index + 1])
      : undefined;
    const showAvatar =
      !isOutgoing &&
      (index === messages.length - 1 || nextUserId !== messageUserId);

    return (
      <View style={styles.messageRow}>
        {isOutgoing ? (
          <>
            <View style={styles.rowSpacer} />
            <Pressable
              onLongPress={() => setActiveReactionMessageId(msg.id)}
              style={[styles.bubble, styles.bubbleOutgoing]}
            >
              <Text style={styles.bubbleText}>{msg.text}</Text>
              {topReaction && (
                <View style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{topReaction}</Text>
                </View>
              )}
            </Pressable>
          </>
        ) : (
          <>
            {!isOutgoing &&
              (showAvatar ? (
                <ChatAvatar
                  imageUrl={otherUserImage}
                  name={otherUserName}
                  size={36}
                  style={styles.msgAvatar}
                />
              ) : (
                <View style={styles.msgAvatarSpacer} />
              ))}
            <Pressable
              onLongPress={() => setActiveReactionMessageId(msg.id)}
              style={[styles.bubble, styles.bubbleIncoming]}
            >
              <Text style={styles.bubbleText}>{msg.text}</Text>
              {topReaction && (
                <View style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{topReaction}</Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </View>
    );
  };

  if (status === "loading" || loading) {
    return (
      <View style={screenStyles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!client || !channel) {
    return (
      <View style={screenStyles.center}>
        <Text style={styles.errorText}>
          {loadError || "Chat unavailable"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={screenStyles.primaryBtn}
        >
          <Text style={screenStyles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.threadHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.black} />
        </Pressable>
        <ChatAvatar
          imageUrl={otherUserImage}
          name={otherUserName}
          size={40}
          style={styles.headerAvatar}
        />
        <Text style={styles.headerName} numberOfLines={1}>
          {otherUserName}
        </Text>
      </View>

      {isBanned && banDescription && (
        <ChatBanMessage
          description={banDescription}
          isPermanent={banDescription.includes("permanent")}
        />
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderMessage}
        {...({
          renderScrollComponent,
        } satisfies Pick<ChatFlatListProps, "renderScrollComponent">)}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
      />

      {isBanned ? (
        <View style={[styles.bannedFooter, { paddingBottom: insets.bottom }]}>
          <Text style={styles.bannedFooterText}>
            Message input disabled — account suspended
          </Text>
        </View>
      ) : (
        <KeyboardStickyView offset={{ closed: insets.bottom, opened: 0 }}>
          <View style={styles.footer} onLayout={onFooterLayout}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={theme.gray500}
              value={input}
              onChangeText={setInput}
              onFocus={() => setTimeout(scrollToLatest, 100)}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending}
              style={[
                styles.sendBtn,
                (!input.trim() || sending) && styles.sendBtnDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator color={theme.white} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={theme.white} />
              )}
            </Pressable>
          </View>
        </KeyboardStickyView>
      )}

      <Modal
        visible={!!activeReactionMessageId}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveReactionMessageId(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveReactionMessageId(null)}
        >
          <View style={styles.emojiPicker}>
            {EMOJI_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  const msg = messages.find(
                    (m) => m.id === activeReactionMessageId,
                  );
                  if (msg) handleReaction(msg, emoji);
                }}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiPickerText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.white },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitial: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.gray600,
  },
  headerName: {
    flex: 1,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.black,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  rowSpacer: { flex: 1 },
  msgAvatar: {
    marginRight: 8,
  },
  msgAvatarSpacer: { width: 44, marginRight: 8 },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    position: "relative",
  },
  bubbleIncoming: { backgroundColor: theme.gray100 },
  bubbleOutgoing: { backgroundColor: "#DBEAFE" },
  bubbleText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  reactionBadge: {
    position: "absolute",
    bottom: -8,
    right: -4,
    backgroundColor: theme.white,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: theme.gray200,
  },
  reactionEmoji: { fontSize: 12 },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.blue500,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  bannedFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
    alignItems: "center",
  },
  bannedFooterText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
  },
  errorText: {
    marginBottom: 16,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPicker: {
    flexDirection: "row",
    backgroundColor: theme.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: theme.shadow100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiBtn: { padding: 4 },
  emojiPickerText: { fontSize: 28 },
});
