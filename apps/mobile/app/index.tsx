import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import {
  FilterDropdown,
  getFilterTitle,
  type FilterKey,
} from "@/components/home/FilterDropdown";
import { HeroSection } from "@/components/home/HeroSection";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { StartupCard } from "@/components/startup/StartupCard";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { theme, typography } from "@/lib/theme";
import type { Startup } from "@foundrly/shared";

export default function HomeScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("recent");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching, error, isError } = useQuery({
    queryKey: ["startups", filter, search],
    queryFn: async () => {
      if (search.trim()) {
        const result = await apiFetch<{ results?: { startups?: Startup[] } }>(
          `/api/ai/semantic-search?q=${encodeURIComponent(search)}&limit=12`,
        );
        return result.results?.startups ?? [];
      }
      const result = await apiFetch<{ startups: Startup[] }>(
        `/api/startups?filter=${filter}`,
      );
      return result.startups ?? [];
    },
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      user
        ? apiFetch<{ recommendations: Startup[] }>(
            "/api/ai/recommendations?limit=6",
          ).then((r) => r.recommendations ?? [])
        : Promise.resolve([]),
    enabled: !!user && !search.trim(),
  });

  return (
    <AppShell>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <StartupCard startup={item} />
          </View>
        )}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            <HeroSection
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => refetch()}
              onSearchClear={() => {
                setSearch("");
                refetch();
              }}
            />

            {user && !search.trim() && recommendations && recommendations.length > 0 && (
              <RecommendationsSection startups={recommendations} />
            )}

            <View style={styles.feedSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {search.trim()
                    ? `Results for "${search}"`
                    : getFilterTitle(filter)}
                </Text>
                <FilterDropdown value={filter} onChange={setFilter} />
              </View>
            </View>

            {isError && (
              <Text style={styles.error}>
                Failed to load startups. Start the web API with `npm run dev` and
                run: adb reverse tcp:3000 tcp:3000{"\n"}
                {error instanceof Error ? error.message : "network error"}
              </Text>
            )}
            {isLoading && (
              <ActivityIndicator
                style={styles.loader}
                color={theme.primary}
              />
            )}
          </>
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <Text style={styles.empty}>No startups found</Text>
          ) : null
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  feedSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.text30Semibold,
    flex: 1,
    paddingRight: 12,
  },
  cardItem: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  list: { paddingBottom: theme.tabBarHeight + 16 },
  loader: { marginTop: 32, marginBottom: 32 },
  empty: {
    marginTop: 28,
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.black100,
    paddingHorizontal: 24,
  },
  error: {
    marginTop: 16,
    paddingHorizontal: 24,
    textAlign: "center",
    color: theme.red600,
    fontFamily: theme.fontFamily.regular,
    lineHeight: 22,
  },
});
