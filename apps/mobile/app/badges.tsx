import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgesFilters } from "@/components/badges/BadgesFilters";
import { BadgesStatsHeader } from "@/components/badges/BadgesStatsHeader";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import {
  buildBadgeStats,
  fetchBadgeTracksFromSanity,
  fetchUserBadges,
  rowsToLeveledBadges,
} from "@/lib/badge-queries";
import { filterBadges, type StatusFilter } from "@/lib/badge-filters";
import { useAuth } from "@/lib/auth-context";
import type { BadgeTier, LeveledBadge } from "@/lib/badges";
import { sanityClient } from "@/lib/sanity";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

type BadgesApiResponse = {
  badges: LeveledBadge[];
  stats: {
    total: number;
    earned: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  };
};

type SyncResponse = {
  awarded: number;
  alreadyHad: number;
  checked: number;
};

async function syncBadges(): Promise<SyncResponse> {
  return apiFetch<SyncResponse>("/api/badges/sync", { method: "POST" });
}

export default function BadgesScreen() {
  const { user, signIn } = useAuth();
  const queryClient = useQueryClient();
  const { user: userParam } = useLocalSearchParams<{ user?: string }>();
  const userId = userParam || user?.id;
  const isOwnProfile = !userParam || userParam === user?.id;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tierFilter, setTierFilter] = useState<BadgeTier | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: author } = useQuery({
    queryKey: ["badges-author", userId],
    queryFn: () =>
      sanityClient.fetch<{ name?: string } | null>(
        `*[_type == "author" && _id == $id][0]{ name }`,
        { id: userId },
      ),
    enabled: !!userId && !isOwnProfile,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["badges-progress", userId],
    queryFn: async () => {
      if (isOwnProfile) {
        try {
          const syncResult = await syncBadges();
          if (syncResult.awarded > 0) {
            Toast.show({
              type: "success",
              text1: `${syncResult.awarded} badge level${syncResult.awarded !== 1 ? "s" : ""} unlocked!`,
            });
            await queryClient.invalidateQueries({ queryKey: ["profile-badges"] });
            await queryClient.invalidateQueries({
              queryKey: ["conversation-badges"],
            });
          }
        } catch (syncError) {
          console.error("Badge sync failed:", syncError);
        }
      }
      const result = await apiFetch<BadgesApiResponse>(
        `/api/badges/user/${userId}`,
      );

      if (result.stats.total === 0) {
        const [fallbackTracks, userRows] = await Promise.all([
          fetchBadgeTracksFromSanity(),
          fetchUserBadges(userId!),
        ]);
        if (fallbackTracks.length > 0) {
          const earnedByTrack = new Map(
            rowsToLeveledBadges(userRows).map((b) => [b._id, b]),
          );
          const badges = fallbackTracks.map(
            (track) => earnedByTrack.get(track._id) ?? track,
          );
          return { badges, stats: buildBadgeStats(badges) };
        }
      }

      return result;
    },
    enabled: !!userId && !!user,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const filteredBadges = useMemo(() => {
    if (!data?.badges) return [];
    return filterBadges(
      data.badges,
      statusFilter,
      tierFilter === "all" ? null : tierFilter,
    );
  }, [data, statusFilter, tierFilter]);

  const headerTitle = isOwnProfile
    ? "My Badges"
    : `${author?.name ?? "User"}'s Badges`;

  if (!user) {
    return (
      <AppShell>
        <MobilePageHeader title="Badges" />
        <View style={screenStyles.center}>
          <Text style={styles.signInText}>Sign in to view badges</Text>
          <Pressable onPress={signIn} style={screenStyles.primaryBtn}>
            <Text style={screenStyles.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title={headerTitle} />
      {isLoading ? (
        <ActivityIndicator style={screenStyles.loader} color={theme.primary} />
      ) : error ? (
        <View style={screenStyles.center}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Failed to load badges"}
          </Text>
          <Pressable onPress={() => refetch()} style={screenStyles.primaryBtn}>
            <Text style={screenStyles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredBadges}
          keyExtractor={(item) => item._id}
          contentContainerStyle={screenStyles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            data ? (
              <>
                <BadgesStatsHeader stats={data.stats} />
                <BadgesFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  tierFilter={tierFilter}
                  onTierFilterChange={setTierFilter}
                />
                <Text style={styles.summary}>
                  Showing {filteredBadges.length} of {data.stats.total} tracks ·{" "}
                  {data.stats.earned} complete
                </Text>
              </>
            ) : null
          }
          renderItem={({ item }) => <BadgeCard badge={item} />}
          ListEmptyComponent={
            <Text style={screenStyles.empty}>
              {data && data.stats.total > 0 && statusFilter !== "all"
                ? `No tracks match the "${statusFilter.replace("_", " ")}" filter. Try All or another filter.`
                : "No badge tracks match your filters."}
            </Text>
          }
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  signInText: {
    marginBottom: 16,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.gray600,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.red600,
    paddingHorizontal: 24,
  },
  summary: {
    marginBottom: 12,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.gray500,
  },
});
