import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onAttach,
  sending,
  uploading,
  disabled,
  replyToName,
  replyToText,
  onDismissReply,
  editingMessageId,
  onDismissEdit,
  onFocus,
  onBlur,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  sending: boolean;
  uploading: boolean;
  disabled?: boolean;
  replyToName?: string;
  replyToText?: string;
  onDismissReply: () => void;
  editingMessageId?: string | null;
  onDismissEdit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const busy = sending || uploading;

  return (
    <View style={styles.wrapper}>
      {replyToName && !editingMessageId && (
        <View style={styles.banner}>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Replying to {replyToName}</Text>
            <Text style={styles.bannerBody} numberOfLines={1}>
              {replyToText}
            </Text>
          </View>
          <Pressable onPress={onDismissReply} hitSlop={8}>
            <Ionicons name="close" size={20} color={theme.gray600} />
          </Pressable>
        </View>
      )}

      {editingMessageId && (
        <View style={styles.banner}>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Editing message</Text>
          </View>
          <Pressable onPress={onDismissEdit} hitSlop={8}>
            <Ionicons name="close" size={20} color={theme.gray600} />
          </Pressable>
        </View>
      )}

      <View style={styles.composerRow}>
        <Pressable
          onPress={onAttach}
          disabled={disabled || busy}
          style={styles.attachBtn}
        >
          <Ionicons name="add-circle-outline" size={28} color={theme.primary} />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.gray500}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          multiline
          maxLength={2000}
        />

        <Pressable
          onPress={onSend}
          disabled={!value.trim() || disabled || busy}
          style={[
            styles.sendBtn,
            (!value.trim() || disabled || busy) && styles.sendBtnDisabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.white} size="small" />
          ) : (
            <Ionicons name="send" size={20} color={theme.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 13,
    color: theme.primary,
  },
  bannerBody: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.gray600,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachBtn: { paddingBottom: 6 },
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
});
