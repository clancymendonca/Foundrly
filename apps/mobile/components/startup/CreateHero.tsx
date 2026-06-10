import { StyleSheet, Text, View } from "react-native";
import { PatternOverlay } from "@/components/ui/PatternOverlay";
import { theme, typography } from "@/lib/theme";

export function CreateHero() {
  return (
    <View style={styles.hero}>
      <PatternOverlay />
      <View style={styles.headingPill}>
        <Text style={styles.heading}>Submit Your Startup</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 230,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    overflow: "hidden",
  },
  headingPill: {
    backgroundColor: theme.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginVertical: 20,
    maxWidth: "100%",
  },
  heading: {
    ...typography.heading,
    textAlign: "center",
  },
});
