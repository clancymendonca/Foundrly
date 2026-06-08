import { StyleSheet, Text, View } from "react-native";
import { theme, typography } from "@/lib/theme";

export function ProfileTitleBadge({ name }: { name?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.skewBackTop} />
      <View style={styles.skewBackBottom} />
      <View style={styles.badge}>
        <Text style={styles.text} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: -36,
    width: "92%",
    alignItems: "center",
    zIndex: 2,
  },
  skewBackTop: {
    position: "absolute",
    top: -4,
    right: 0,
    width: "100%",
    height: 60,
    backgroundColor: theme.black,
    borderRadius: 20,
    transform: [{ skewY: "-6deg" }],
    zIndex: -1,
  },
  skewBackBottom: {
    position: "absolute",
    bottom: -4,
    left: 0,
    width: "100%",
    height: 60,
    backgroundColor: theme.black,
    borderRadius: 20,
    transform: [{ skewY: "-6deg" }],
    zIndex: -1,
  },
  badge: {
    width: "100%",
    backgroundColor: theme.white,
    borderWidth: 5,
    borderColor: theme.black,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: theme.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  text: {
    ...typography.text24Black,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
