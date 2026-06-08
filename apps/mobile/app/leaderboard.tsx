import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { sanityClient } from "@/lib/sanity";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export default function LeaderboardScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      sanityClient.fetch(
        `*[_type == "author"]{
          _id, name, image, username,
          "badgeCount": count(*[_type == "userBadge" && user._ref == ^._id])
        } | order(badgeCount desc)[0...50]`,
      ),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Leaderboard" />
      <FlatList
        data={data ?? []}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={screenStyles.listContent}
        renderItem={({ item, index }: any) => (
          <View style={[screenStyles.card, styles.row]}>
            <Text style={styles.rank}>{index + 1}</Text>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.avatar} />
            )}
            <View style={styles.info}>
              <Text style={screenStyles.cardTitle}>
                {item.name || item.username}
              </Text>
              <Text style={screenStyles.cardDesc}>
                {item.badgeCount} badges
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={screenStyles.empty}>No leaderboard data</Text>
          ) : null
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  rank: {
    width: 32,
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.primary,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  info: { flex: 1 },
});
