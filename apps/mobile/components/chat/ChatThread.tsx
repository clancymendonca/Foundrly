import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { LocalMessage } from "stream-chat";
import Toast from "react-native-toast-message";
import { AttachmentPicker } from "./AttachmentPicker";
import { ChatAvatar } from "./ChatAvatar";
import { ChatBanMessage } from "./ChatBanMessage";
import { ChatComposer } from "./ChatComposer";
import { ChatDateSeparator } from "./ChatDateSeparator";
import { MessageActionsSheet, type MessageAction } from "./MessageActionsSheet";
import { ChatConversationDetails } from "./ChatConversationDetails";
import { ChatScrollView } from "./ChatScrollView";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import {
  EMOJI_REACTIONS,
  EMOJI_TO_REACTION_TYPE,
} from "./reactions";
import { uploadAndSendAttachment } from "@/lib/chat-attachments";
import { apiFetch } from "@/lib/api-client";
import {
  fetchChatProfile,
  getChannelOtherUser,
  getMessageUserId,
  getOtherMemberId,
  type ChatProfile,
} from "@/lib/chat-utils";
import { useAuth } from "@/lib/auth-context";
import { useStreamChat } from "@/lib/stream-chat-context";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
import { useChannelMessages } from "@/hooks/use-channel-messages";
import { useChatModerationPref } from "@/hooks/use-chat-moderation-pref";
import { usePeerPresence } from "@/hooks/use-peer-presence";
import { useStreamChatPush } from "@/hooks/use-stream-chat-push";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { useChatThreadItems, type ChatThreadItem } from "@/lib/chat-thread-items";

interface ChatThreadProps {
  channelId: string;
}

type ChatFlatListProps = React.ComponentProps<typeof FlatList<ChatThreadItem>> & {
  renderScrollComponent?: (props: ScrollViewProps) => React.ReactElement;
};

const BASE_FOOTER_HEIGHT = 60;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

export function ChatThread({ channelId }: ChatThreadProps) {
  const { user } = useAuth();
  const { client, status, banDescription } = useStreamChat();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ChatProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<LocalMessage | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<LocalMessage | null>(
    null,
  );
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<
    string | null
  >(null);

  const listRef = useRef<FlatList<ChatThreadItem>>(null);
  const insets = useSafeAreaInsets();
  const extraContentPadding = useSharedValue(0);

  const {
    channel,
    messages,
    loading,
    loadError,
    loadingEarlier,
    hasMore,
    loadEarlier,
    readRevision,
  } = useChannelMessages(client, user?.id, channelId, status);

  const { enabled: moderationEnabled, setModerationEnabled } =
    useChatModerationPref(channelId);

  const threadItems = useChatThreadItems(messages);

  useStreamChatPush(client, user?.id, status === "ready");

  const otherUser = channel
    ? getChannelOtherUser(channel, user?.id ?? "", messages)
    : null;
  const otherUserId = channel && user?.id ? getOtherMemberId(channel, user.id) : null;
  const otherUserImage = otherProfile?.imageUrl ?? otherUser?.image;
  const otherUserName =
    otherProfile?.name ?? otherUser?.name ?? otherUser?.id ?? "Chat";

  const { isPeerTyping, emitTyping, stopTyping } = useTypingIndicator(
    channel,
    user?.id,
  );
  const { online } = usePeerPresence(channel, otherUserId);

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

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

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

  const moderateText = async (text: string) => {
    if (!moderationEnabled) return true;

    const data = await apiFetch<{
      result?: { isFlagged?: boolean; reason?: string };
    }>("/api/moderation/check", {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });

    if (data.result?.isFlagged) {
      Toast.show({
        type: "error",
        text1: "Message flagged",
        text2:
          data.result.reason ||
          "Your message may violate community guidelines.",
      });
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || !channel || sending || isBanned) return;

    setSending(true);
    try {
      const ok = await moderateText(input);
      if (!ok) return;

      if (editingMessage) {
        await client!.updateMessage({
          id: editingMessage.id,
          text: input.trim(),
        });
        setEditingMessage(null);
      } else {
        await channel.sendMessage({
          text: input.trim(),
          ...(replyTo
            ? { parent_id: replyTo.id, show_in_channel: true }
            : {}),
        });
        setReplyTo(null);
      }

      setInput("");
      stopTyping();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e instanceof Error ? e.message : "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async (
    picked: Parameters<typeof uploadAndSendAttachment>[1],
  ) => {
    if (!channel || uploading || isBanned) return;

    setUploading(true);
    try {
      if (input.trim()) {
        const ok = await moderateText(input);
        if (!ok) return;
      }
      await uploadAndSendAttachment(channel, picked, input.trim() || undefined);
      setInput("");
      setReplyTo(null);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e instanceof Error ? e.message : "Failed to send attachment",
      });
    } finally {
      setUploading(false);
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

  const openActions = (msg: LocalMessage) => {
    setActiveMessage(msg);
    setActionsOpen(true);
  };

  const handleMessageAction = async (action: MessageAction) => {
    if (!activeMessage || !client) return;

    switch (action) {
      case "react":
        setActiveReactionMessageId(activeMessage.id);
        break;
      case "reply":
        setReplyTo(activeMessage);
        setEditingMessage(null);
        break;
      case "copy":
        if (activeMessage.text) {
          await Clipboard.setStringAsync(activeMessage.text);
          Toast.show({ type: "success", text1: "Copied" });
        }
        break;
      case "edit": {
        const created = new Date(String(activeMessage.created_at)).getTime();
        if (Date.now() - created > EDIT_WINDOW_MS) {
          Toast.show({
            type: "error",
            text1: "Edit window expired",
            text2: "Messages can only be edited within 15 minutes.",
          });
          break;
        }
        setEditingMessage(activeMessage);
        setInput(activeMessage.text || "");
        setReplyTo(null);
        break;
      }
      case "delete":
        try {
          await client.deleteMessage(activeMessage.id);
        } catch {
          Toast.show({ type: "error", text1: "Could not delete message" });
        }
        break;
    }
  };

  const renderThreadItem = ({ item }: { item: ChatThreadItem }) => {
    if (item.type === "date") {
      return <ChatDateSeparator label={item.label} />;
    }

    return (
      <MessageBubble
        msg={item.message}
        index={item.messageIndex}
        messages={messages}
        userId={user?.id ?? ""}
        channel={channel}
        otherUserImage={otherUserImage}
        otherUserName={otherUserName}
        onLongPress={openActions}
      />
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
        <Pressable
          style={styles.headerProfile}
          onPress={() => setDetailsOpen(true)}
        >
          <ChatAvatar
            imageUrl={otherUserImage}
            name={otherUserName}
            size={40}
            online={online}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUserName}
            </Text>
            <TypingIndicator visible={isPeerTyping} />
          </View>
        </Pressable>
      </View>

      {isBanned && banDescription && (
        <ChatBanMessage
          description={banDescription}
          isPermanent={banDescription.includes("permanent")}
        />
      )}

      <FlatList
        ref={listRef}
        data={threadItems}
        extraData={readRevision}
        keyExtractor={(item) => item.id}
        renderItem={renderThreadItem}
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
        onScroll={(event) => {
          if (event.nativeEvent.contentOffset.y < 48 && hasMore && !loadingEarlier) {
            loadEarlier();
          }
        }}
        scrollEventThrottle={200}
        ListHeaderComponent={
          loadingEarlier ? (
            <ActivityIndicator
              color={theme.primary}
              style={styles.loadEarlier}
            />
          ) : null
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
          <View onLayout={onFooterLayout}>
            <ChatComposer
              value={input}
              onChangeText={(text) => {
                setInput(text);
                emitTyping();
              }}
              onSend={handleSend}
              onAttach={() => setAttachOpen(true)}
              sending={sending}
              uploading={uploading}
              replyToName={
                replyTo
                  ? replyTo.user?.name || otherUserName
                  : undefined
              }
              replyToText={replyTo?.text || "Attachment"}
              onDismissReply={() => setReplyTo(null)}
              editingMessageId={editingMessage?.id}
              onDismissEdit={() => {
                setEditingMessage(null);
                setInput("");
              }}
              onFocus={() => setTimeout(scrollToLatest, 100)}
              onBlur={stopTyping}
            />
          </View>
        </KeyboardStickyView>
      )}

      <ChatConversationDetails
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        channel={channel}
        messages={messages}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        otherUserImage={otherUserImage}
        moderationEnabled={moderationEnabled}
        onModerationChange={setModerationEnabled}
      />

      <AttachmentPicker
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPick={handleAttachment}
      />

      <MessageActionsSheet
        visible={actionsOpen}
        isOwnMessage={
          !!activeMessage && getMessageUserId(activeMessage) === user?.id
        }
        onClose={() => setActionsOpen(false)}
        onAction={handleMessageAction}
      />

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
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: { marginRight: 10 },
  headerTextWrap: { flex: 1 },
  headerName: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.black,
  },
  messageList: { flex: 1 },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadEarlier: { marginVertical: 12 },
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
