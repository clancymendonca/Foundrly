import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

export type MessageAction = "reply" | "copy" | "edit" | "delete" | "react";

export function MessageActionsSheet({
  visible,
  isOwnMessage,
  onClose,
  onAction,
}: {
  visible: boolean;
  isOwnMessage: boolean;
  onClose: () => void;
  onAction: (action: MessageAction) => void;
}) {
  const insets = useSafeAreaInsets();

  const actions: {
    id: MessageAction;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "react", label: "React", icon: "happy-outline" },
    { id: "reply", label: "Reply", icon: "arrow-undo-outline" },
    { id: "copy", label: "Copy", icon: "copy-outline" },
  ];

  if (isOwnMessage) {
    actions.push(
      { id: "edit", label: "Edit", icon: "create-outline" },
      { id: "delete", label: "Delete", icon: "trash-outline" },
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              style={styles.actionRow}
              onPress={() => {
                onAction(action.id);
                onClose();
              }}
            >
              <Ionicons
                name={action.icon}
                size={22}
                color={action.id === "delete" ? theme.red600 : theme.black}
              />
              <Text
                style={[
                  styles.actionLabel,
                  action.id === "delete" && styles.deleteLabel,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancelRow} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 5,
    borderColor: theme.black,
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  actionLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
  },
  deleteLabel: { color: theme.red600 },
  cancelRow: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.gray100,
  },
  cancelText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.gray600,
  },
});
