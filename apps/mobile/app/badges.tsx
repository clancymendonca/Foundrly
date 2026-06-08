import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/auth-context";
import { sanityClient } from "@/lib/sanity";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export default function BadgesScreen() {
  const { user } = useAuth();
  const { user: userParam } = useLocalSearchParams<{ user?: string }>();
  const userId = userParam || user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["badges", userId],
    queryFn: () =>
      sanityClient.fetch(
        `*[_type == "userBadge" && user._ref == $userId]{
          _id,
          badge->{_id, name, description, icon, tier},
          earnedAt
        } | order(earnedAt desc)`,
        { userId },
      ),
    enabled: !!userId,
  });

  return (
    <AppShell>
      <MobilePageHeader title="My Badges" />
      {isLoading ? (
        <ActivityIndicator style={screenStyles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={screenStyles.listContent}
          renderItem={({ item }: any) => (
            <View style={screenStyles.card}>
              <Text style={styles.badgeName}>{item.badge?.name}</Text>
              <Text style={screenStyles.cardDesc}>{item.badge?.description}</Text>
              <Text style={styles.tier}>{item.badge?.tier}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={screenStyles.empty}>No badges yet</Text>}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  badgeName: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.black,
  },
  tier: {
    marginTop: 4,
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.primary,
    textTransform: "capitalize",
  },
});
