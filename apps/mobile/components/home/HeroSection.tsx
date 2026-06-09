import { StyleSheet, Text, View } from "react-native";
import { PatternOverlay } from "@/components/ui/PatternOverlay";
import { SearchForm } from "@/components/home/SearchForm";
import { theme, typography } from "@/lib/theme";

export function HeroSection({
  search,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear?: () => void;
}) {
  return (
    <View style={styles.hero}>
      <PatternOverlay />
      <View style={styles.headingPill}>
        <Text style={styles.heading}>
          pitch your startup,{"\n"}Connect with enterpreneurs
        </Text>
      </View>
      <Text style={styles.subHeading}>
        Submit Ideas, Vote on Pitches, and Get Noticed in Virtual Competition
      </Text>
      <SearchForm
        value={search}
        onChangeText={onSearchChange}
        onSubmit={onSearchSubmit}
        onClear={onSearchClear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    minHeight: 530,
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
  subHeading: {
    ...typography.subHeading,
    maxWidth: 480,
    marginBottom: 8,
  },
});
