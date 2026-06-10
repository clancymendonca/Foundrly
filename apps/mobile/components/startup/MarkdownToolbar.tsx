import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export type MarkdownInsert =
  | { kind: "wrap"; before: string; after: string; placeholder?: string }
  | { kind: "prefix"; prefix: string; placeholder?: string };

interface ToolbarAction {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  insert: MarkdownInsert;
}

const ACTIONS: ToolbarAction[] = [
  {
    id: "bold",
    label: "B",
    insert: { kind: "wrap", before: "**", after: "**", placeholder: "bold" },
  },
  {
    id: "italic",
    label: "I",
    insert: { kind: "wrap", before: "*", after: "*", placeholder: "italic" },
  },
  {
    id: "h2",
    label: "H2",
    insert: { kind: "prefix", prefix: "## ", placeholder: "Heading" },
  },
  {
    id: "list",
    label: "",
    icon: "list-outline",
    insert: { kind: "prefix", prefix: "- ", placeholder: "List item" },
  },
  {
    id: "quote",
    label: "",
    icon: "chatbox-ellipses-outline",
    insert: { kind: "prefix", prefix: "> ", placeholder: "Quote" },
  },
  {
    id: "code",
    label: "",
    icon: "code-slash-outline",
    insert: { kind: "wrap", before: "`", after: "`", placeholder: "code" },
  },
  {
    id: "link",
    label: "",
    icon: "link-outline",
    insert: {
      kind: "wrap",
      before: "[",
      after: "](https://)",
      placeholder: "label",
    },
  },
];

interface MarkdownToolbarProps {
  onAction: (insert: MarkdownInsert) => void;
  disabled?: boolean;
}

export function MarkdownToolbar({ onAction, disabled = false }: MarkdownToolbarProps) {
  return (
    <View style={styles.track}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="always"
      >
        {ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onAction(action.insert)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.btn,
              pressed && !disabled && styles.btnPressed,
              disabled && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.id}
          >
            {action.icon ? (
              <Ionicons name={action.icon} size={16} color={theme.gray700} />
            ) : (
              <Text style={styles.btnLabel}>{action.label}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
    backgroundColor: theme.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  btn: {
    minWidth: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.gray200,
    backgroundColor: theme.gray100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  btnPressed: {
    backgroundColor: theme.gray200,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnLabel: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 13,
    color: theme.gray700,
  },
});
