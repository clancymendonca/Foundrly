import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function MobilePageHeader({
  title,
  backHref,
  rightAction,
}: {
  title: string;
  backHref?: string;
  rightAction?: ReactNode;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => (backHref ? router.push(backHref as any) : router.back())}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color={theme.black} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightSlot}>
        {rightAction ?? <View style={styles.rightSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { marginRight: 8, padding: 4 },
  title: {
    flex: 1,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    color: theme.black,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },
  rightSpacer: {
    width: 32,
    height: 32,
  },
});
