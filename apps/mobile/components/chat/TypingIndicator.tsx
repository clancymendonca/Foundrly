import { StyleSheet, Text } from "react-native";
import { theme } from "@/lib/theme";

export function TypingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return <Text style={styles.text}>typing…</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.gray500,
    marginTop: 1,
  },
});
