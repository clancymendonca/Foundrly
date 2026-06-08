import type { Message } from "@foundrly/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatAvatar } from "./ChatAvatar";
import { theme } from "@/lib/theme";

interface MessageListItemProps {
  item: Message;
  onSelect: (id: string) => void;
}

export function MessageListItem({ item, onSelect }: MessageListItemProps) {
  const hasUnread = !!item.unreadCount && item.unreadCount > 0;

  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={[styles.row, hasUnread && styles.rowUnread]}
    >
      <ChatAvatar
        imageUrl={item.avatarUrl}
        name={item.name}
        size={50}
        style={styles.avatar}
      />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, hasUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount! > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.preview, hasUnread && styles.previewUnread]}
          numberOfLines={1}
        >
          {item.message}
        </Text>
      </View>

      {item.time ? (
        <Text style={[styles.time, hasUnread && styles.timeUnread]}>
          {item.time}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rowUnread: {
    backgroundColor: "rgba(78, 113, 255, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  avatar: {
    marginRight: 12,
  },
  body: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.black,
  },
  nameUnread: { color: "#1E3A8A" },
  badge: {
    backgroundColor: theme.blue500,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
  },
  badgeText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 11,
    color: theme.white,
  },
  preview: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray600,
    marginTop: 2,
  },
  previewUnread: {
    fontFamily: theme.fontFamily.medium,
    color: "#1D4ED8",
  },
  time: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.gray500,
    marginLeft: 8,
  },
  timeUnread: {
    fontFamily: theme.fontFamily.medium,
    color: theme.blue500,
  },
});
