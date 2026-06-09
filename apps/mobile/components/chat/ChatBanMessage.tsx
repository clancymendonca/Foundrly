import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

interface ChatBanMessageProps {
  description: string;
  isPermanent?: boolean;
}

export function ChatBanMessage({
  description,
  isPermanent = false,
}: ChatBanMessageProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={isPermanent ? "ban" : "time-outline"}
        size={20}
        color={theme.red600}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.note}>
          You cannot send messages while your account is suspended.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  icon: { marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  title: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 14,
    color: "#991B1B",
  },
  description: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: "#B91C1C",
    marginTop: 4,
  },
  note: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.red600,
    marginTop: 8,
  },
});
