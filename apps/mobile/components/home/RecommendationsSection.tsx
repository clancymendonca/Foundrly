import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { StartupCard } from "@/components/startup/StartupCard";
import { theme, typography } from "@/lib/theme";
import type { Startup } from "@foundrly/shared";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 48;

export function RecommendationsSection({
  startups,
}: {
  startups: Startup[];
}) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / CARD_WIDTH));
  };

  if (!startups.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Recommended Startups for you</Text>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        data={startups}
        keyExtractor={(item) => `rec-${item._id}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.cardWrap, { width: CARD_WIDTH }]}>
            <StartupCard startup={item} />
          </View>
        )}
      />
      <View style={styles.dots}>
        {startups.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    ...typography.text30Semibold,
    marginBottom: 28,
  },
  cardWrap: { paddingRight: 0 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.gray200,
  },
  dotActive: { backgroundColor: theme.primary },
});
