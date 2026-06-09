import { StyleSheet, View } from "react-native";

const STRIPE_COUNT = 40;

export function PatternOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stripe,
            { left: `${(i / STRIPE_COUNT) * 100}%` },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "1.2%",
    backgroundColor: "rgba(251, 232, 67, 0.45)",
  },
});
