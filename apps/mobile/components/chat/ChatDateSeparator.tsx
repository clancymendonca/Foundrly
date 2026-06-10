import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function ChatDateSeparator({ label }: { label: string }) {
  if (!label) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginVertical: 16,
  },
  pill: {
    backgroundColor: theme.gray100,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.gray200,
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray600,
  },
});
