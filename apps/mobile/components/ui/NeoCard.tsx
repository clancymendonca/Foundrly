import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "@/lib/theme";

type ShadowVariant = "100" | "200" | "300";

const shadowColors: Record<ShadowVariant, string> = {
  "100": theme.shadow100,
  "200": theme.shadow200,
  "300": theme.shadow300,
};

export function NeoCard({
  children,
  shadow = "200",
  backgroundColor = theme.white,
  borderRadius = 22,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  shadow?: ShadowVariant;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.shadow,
          { backgroundColor: shadowColors[shadow], borderRadius },
        ]}
      />
      <View
        style={[
          styles.card,
          { backgroundColor, borderRadius },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
    marginRight: 4,
    position: "relative",
  },
  shadow: {
    position: "absolute",
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
  },
  card: {
    borderWidth: 5,
    borderColor: theme.black,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
});
