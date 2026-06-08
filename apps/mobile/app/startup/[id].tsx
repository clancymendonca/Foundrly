import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Markdown from "react-native-markdown-display";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { urlForImage } from "@/lib/sanity";
import type { Startup } from "@foundrly/shared";

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startup", id],
    queryFn: () => apiFetch<Startup>(`/api/startups/${id}`),
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/likes", {
        method: "POST",
        body: JSON.stringify({ startupId: id }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startup", id] }),
  });

  if (isLoading || !startup) {
    return (
      <AppShell>
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScrollView className="flex-1 pb-24">
        <Image
          source={{ uri: urlForImage(startup.image || "") }}
          className="h-56 w-full"
          contentFit="cover"
        />
        <View className="p-4">
          <Text className="text-2xl font-bold">{startup.title}</Text>
          <Text className="mt-2 text-gray-600">{startup.description}</Text>
          <Text className="mt-2 rounded bg-secondary px-2 py-1 self-start text-xs font-bold uppercase">
            {startup.category}
          </Text>

          {user && (
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => likeMutation.mutate()}
                className="rounded-lg bg-primary px-4 py-2"
              >
                <Text className="text-white">Like ({startup.likes ?? 0})</Text>
              </Pressable>
            </View>
          )}

          {startup.pitch && (
            <View className="mt-6">
              <Text className="mb-2 text-lg font-bold">Pitch</Text>
              <Markdown>{startup.pitch}</Markdown>
            </View>
          )}
        </View>
      </ScrollView>
    </AppShell>
  );
}
