import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

interface StartupEditButtonProps {
  startupId: string;
  isOwner: boolean;
  variant?: "icon" | "pill";
}

export function StartupEditButton({
  startupId,
  isOwner,
  variant = "icon",
}: StartupEditButtonProps) {
  if (!isOwner) return null;

  return (
    <Link href={`/startup/${startupId}/edit` as any} asChild>
      <Pressable
        style={variant === "icon" ? styles.iconBtn : styles.editBtn}
        accessibilityRole="button"
        accessibilityLabel="Edit startup"
        hitSlop={8}
      >
        <Ionicons
          name="create-outline"
          size={variant === "icon" ? 22 : 18}
          color={variant === "icon" ? theme.black : theme.white}
        />
        {variant === "pill" ? <Text style={styles.editText}>Edit</Text> : null}
      </Pressable>
    </Link>
  );
}

export function StartupDetailActions({
  startupId,
  isOwner,
}: {
  startupId: string;
  isOwner: boolean;
}) {
  if (!isOwner) return null;

  return (
    <View style={styles.row}>
      <StartupEditButton startupId={startupId} isOwner={isOwner} variant="pill" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.primary,
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.white,
  },
});
