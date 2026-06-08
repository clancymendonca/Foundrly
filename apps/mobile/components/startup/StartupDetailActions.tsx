import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

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
      <Link href={`/startup/${startupId}/edit` as any} asChild>
        <Pressable style={styles.editBtn}>
          <Ionicons name="create-outline" size={18} color={theme.white} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
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
