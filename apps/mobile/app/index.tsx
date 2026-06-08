import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { StartupCard } from "@/components/startup/StartupCard";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Startup } from "@foundrly/shared";

const FILTERS = ["recent", "popular", "viewed", "liked"] as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("recent");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
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
      return result.startups;
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
    enabled: !!user,
  });

  return (
    <AppShell>
      <View className="bg-primary px-6 py-10">
        <Text className="text-center text-3xl font-extrabold text-white">
          pitch your startup,{"\n"}Connect with entrepreneurs
        </Text>
        <TextInput
          className="mt-6 rounded-lg bg-white px-4 py-3"
          placeholder="Search startups..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => refetch()}
          returnKeyType="search"
        />
      </View>

      {user && recommendations && recommendations.length > 0 && (
        <View className="px-4 py-4">
          <Text className="mb-2 text-lg font-bold">AI Recommendations</Text>
          <FlatList
            horizontal
            data={recommendations}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View className="mr-4 w-72">
                <StartupCard startup={item} />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <View className="flex-row flex-wrap gap-2 px-4 py-2">
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-full px-4 py-2 ${filter === f ? "bg-primary" : "bg-gray-100"}`}
          >
            <Text className={filter === f ? "text-white" : "text-gray-700"}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <StartupCard startup={item} />}
          contentContainerClassName="px-4 pb-24"
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500">
              No startups found
            </Text>
          }
        />
      )}
    </AppShell>
  );
}
