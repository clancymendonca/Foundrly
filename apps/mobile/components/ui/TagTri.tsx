import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { theme } from "@/lib/theme";

export function TagTri({
  children,
  style,
  textStyle,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  return (
    <View style={[styles.tag, style]}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: "relative",
    backgroundColor: theme.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  text: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.black,
    textTransform: "uppercase",
  },
  corner: {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid",
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderTopColor: theme.black,
    borderRightColor: "transparent",
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 10,
    borderLeftWidth: 10,
    borderBottomColor: theme.black,
    borderLeftColor: "transparent",
  },
});
