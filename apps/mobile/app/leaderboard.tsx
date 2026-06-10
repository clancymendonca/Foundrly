import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { sanityClient } from "@/lib/sanity";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

const LEADERBOARD_QUERY = `*[_type == "author"]{
  _id, name, image, username,
  "badgeCount": count(*[_type == "userBadge" && user._ref == ^._id && badge->isActive == true])
} | order(badgeCount desc)[0...50]`;

type LeaderboardEntry = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  badgeCount: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => sanityClient.fetch<LeaderboardEntry[]>(LEADERBOARD_QUERY),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Leaderboard" />
      {isLoading ? (
        <ActivityIndicator style={screenStyles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={screenStyles.listContent}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/user/${item._id}` as never)}
              style={[screenStyles.card, styles.row]}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {(item.name || item.username || "?")[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={screenStyles.cardTitle}>
                  {item.name || item.username}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push(`/badges?user=${item._id}` as never);
                  }}
                >
                  <Text style={styles.badgeLink}>
                    {item.badgeCount} badges
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={screenStyles.empty}>No leaderboard data</Text>
          }
        />
      )}
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
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.gray600,
  },
  info: { flex: 1 },
  badgeLink: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.primary,
    marginTop: 2,
  },
});
