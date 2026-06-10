import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ConversationMediaItem } from "@/hooks/use-conversation-media";
import { isImageAttachment } from "@/lib/chat-attachments";
import { theme } from "@/lib/theme";

export function ConversationMediaGrid({
  items,
  emptyLabel,
}: {
  items: ConversationMediaItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={36} color={theme.gray500} />
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.cell}
          onPress={async () => {
            if (!item.url) return;
            if (isImageAttachment(item.attachment)) {
              Linking.openURL(item.url).catch(() => {});
              return;
            }
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(item.url).catch(() =>
                Linking.openURL(item.url!).catch(() => {}),
              );
            } else {
              Linking.openURL(item.url).catch(() => {});
            }
          }}
        >
          {isImageAttachment(item.attachment) && item.url ? (
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.fileCell}>
              <Ionicons name="document-outline" size={28} color={theme.primary} />
              <Text style={styles.fileName} numberOfLines={2}>
                {item.title || "File"}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cell: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: theme.gray100,
    borderWidth: 2,
    borderColor: theme.black,
  },
  image: { width: "100%", height: "100%" },
  fileCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 6,
  },
  fileName: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 11,
    color: theme.black,
    textAlign: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
