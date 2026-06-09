import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function MobilePageHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => (backHref ? router.push(backHref as any) : router.back())}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={24} color={theme.black} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
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
  backBtn: { marginRight: 12, padding: 4 },
  title: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    color: theme.black,
  },
});
