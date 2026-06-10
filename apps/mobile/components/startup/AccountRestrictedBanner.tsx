import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NeoCard } from "@/components/ui/NeoCard";
import { theme } from "@/lib/theme";

interface AccountRestrictedBannerProps {
  message: string;
  isPermanent?: boolean;
}

export function AccountRestrictedBanner({
  message,
  isPermanent = false,
}: AccountRestrictedBannerProps) {
  return (
    <NeoCard style={styles.wrap} contentStyle={styles.inner}>
      <View style={styles.row}>
        <Ionicons
          name={isPermanent ? "ban" : "time-outline"}
          size={22}
          color={theme.red600}
        />
        <View style={styles.content}>
          <Text style={styles.title}>Account restricted</Text>
          <Text style={styles.description}>{message}</Text>
          <Text style={styles.note}>
            You cannot create or edit startups while your account is restricted.
          </Text>
        </View>
      </View>
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  inner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#FEF2F2",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  content: { flex: 1 },
  title: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 15,
    color: "#991B1B",
  },
  description: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: "#B91C1C",
    marginTop: 4,
    lineHeight: 20,
  },
  note: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.red600,
    marginTop: 8,
  },
});
