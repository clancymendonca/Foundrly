import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LocalMessage } from "stream-chat";
import type { Channel } from "stream-chat";
import { ChatAvatar } from "./ChatAvatar";
import { LinkifiedText } from "./LinkifiedText";
import {
  REACTION_TYPE_TO_EMOJI,
} from "./reactions";
import { getAttachmentUrl, isImageAttachment } from "@/lib/chat-attachments";
import { getMessageUserId, isMessageEdited, isMessageSeenByPeer } from "@/lib/chat-utils";
import { theme } from "@/lib/theme";

function getTopReaction(msg: LocalMessage): string | null {
  const reactions = msg.latest_reactions || [];
  const counts: Record<string, number> = {};
  reactions.forEach((r) => {
    const emoji = REACTION_TYPE_TO_EMOJI[r.type];
    if (emoji) counts[emoji] = (counts[emoji] || 0) + 1;
  });
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function isLastOutgoingInThread(
  messages: LocalMessage[],
  index: number,
  userId: string,
): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (getMessageUserId(messages[i]) === userId) {
      return i === index;
    }
  }
  return false;
}

function getReadLabel(
  channel: Channel | null,
  msg: LocalMessage,
  messages: LocalMessage[],
  userId: string,
): string | null {
  if (!channel) return null;

  return isMessageSeenByPeer(channel, msg, messages, userId)
    ? "Seen"
    : "Delivered";
}

export function MessageBubble({
  msg,
  index,
  messages,
  userId,
  channel,
  otherUserImage,
  otherUserName,
  onLongPress,
}: {
  msg: LocalMessage;
  index: number;
  messages: LocalMessage[];
  userId: string;
  channel: Channel | null;
  otherUserImage?: string;
  otherUserName?: string;
  onLongPress: (msg: LocalMessage) => void;
}) {
  const messageUserId = getMessageUserId(msg);
  const isOutgoing = messageUserId === userId;
  const topReaction = getTopReaction(msg);
  const readLabel =
    isOutgoing && isLastOutgoingInThread(messages, index, userId)
      ? getReadLabel(channel, msg, messages, userId)
      : null;

  const nextUserId = messages[index + 1]
    ? getMessageUserId(messages[index + 1])
    : undefined;
  const showAvatar =
    !isOutgoing &&
    (index === messages.length - 1 || nextUserId !== messageUserId);

  const parentMessage = msg.parent_id
    ? messages.find((m) => m.id === msg.parent_id)
    : undefined;

  if (msg.deleted_at || msg.type === "deleted") {
    return (
      <View style={styles.messageRow}>
        {messageUserId === userId ? (
          <>
            <View style={styles.rowSpacer} />
            <View style={[styles.bubble, styles.deletedBubble]}>
              <Text style={styles.deletedText}>Message deleted</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.msgAvatarSpacer} />
            <View style={[styles.bubble, styles.deletedBubble]}>
              <Text style={styles.deletedText}>Message deleted</Text>
            </View>
          </>
        )}
      </View>
    );
  }

  const bubbleContent = (
    <>
      {parentMessage && (
        <View style={styles.quote}>
          <Text style={styles.quoteAuthor} numberOfLines={1}>
            {parentMessage.user?.name || "Message"}
          </Text>
          <Text style={styles.quoteText} numberOfLines={2}>
            {parentMessage.text || "Attachment"}
          </Text>
        </View>
      )}

      {msg.attachments?.map((att, attIndex) => {
        const url = getAttachmentUrl(att);
        if (isImageAttachment(att) && url) {
          return (
            <Pressable
              key={`${msg.id}-att-${attIndex}`}
              onPress={() => Linking.openURL(url).catch(() => {})}
            >
              <Image
                source={{ uri: url }}
                style={styles.imageAttachment}
                contentFit="cover"
              />
            </Pressable>
          );
        }

        if (att.type === "file" || att.asset_url) {
          return (
            <Pressable
              key={`${msg.id}-att-${attIndex}`}
              style={styles.fileAttachment}
              onPress={async () => {
                if (url) {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(url).catch(() =>
                      Linking.openURL(url).catch(() => {}),
                    );
                  } else {
                    Linking.openURL(url).catch(() => {});
                  }
                }
              }}
            >
              <Ionicons name="document-outline" size={20} color={theme.black} />
              <Text style={styles.fileTitle} numberOfLines={1}>
                {att.title || att.fallback || "File"}
              </Text>
            </Pressable>
          );
        }

        return null;
      })}

      {msg.text ? (
        <LinkifiedText text={msg.text} style={styles.bubbleText} />
      ) : null}

      {isMessageEdited(msg) ? (
        <Text style={styles.editedLabel}>(edited)</Text>
      ) : null}

      {topReaction && (
        <View style={styles.reactionBadge}>
          <Text style={styles.reactionEmoji}>{topReaction}</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.messageRow}>
      {isOutgoing ? (
        <>
          <View style={styles.rowSpacer} />
          <View style={styles.outgoingColumn}>
            <Pressable
              onLongPress={() => onLongPress(msg)}
              style={[styles.bubble, styles.bubbleOutgoing]}
            >
              {bubbleContent}
            </Pressable>
            {readLabel ? (
              <Text style={styles.readLabel}>{readLabel}</Text>
            ) : null}
          </View>
        </>
      ) : (
        <>
          {showAvatar ? (
            <ChatAvatar
              imageUrl={otherUserImage}
              name={otherUserName}
              size={36}
              style={styles.msgAvatar}
            />
          ) : (
            <View style={styles.msgAvatarSpacer} />
          )}
          <Pressable
            onLongPress={() => onLongPress(msg)}
            style={[styles.bubble, styles.bubbleIncoming, styles.incomingBubble]}
          >
            {bubbleContent}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  rowSpacer: { flex: 1 },
  outgoingColumn: {
    maxWidth: "75%",
    alignItems: "flex-end",
    gap: 4,
  },
  readLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.gray500,
    marginRight: 4,
  },
  msgAvatar: { marginRight: 8 },
  msgAvatarSpacer: { width: 44, marginRight: 8 },
  bubble: {
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    position: "relative",
    gap: 6,
  },
  bubbleIncoming: {
    backgroundColor: theme.gray100,
    borderWidth: 2,
    borderColor: theme.black,
  },
  bubbleOutgoing: {
    backgroundColor: theme.primary100,
    borderWidth: 2,
    borderColor: theme.black,
    alignSelf: "flex-end",
  },
  incomingBubble: { maxWidth: "75%" },
  deletedBubble: {
    backgroundColor: theme.gray100,
    maxWidth: "60%",
  },
  deletedText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    fontStyle: "italic",
    color: theme.gray500,
  },
  bubbleText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  editedLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.gray500,
    marginTop: 2,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    paddingLeft: 8,
    marginBottom: 4,
  },
  quoteAuthor: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 12,
    color: theme.gray700,
  },
  quoteText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.gray600,
  },
  imageAttachment: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: theme.gray200,
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fileTitle: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
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
});
