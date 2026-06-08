import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { StartupCard } from "@/components/startup/StartupCard";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { sanityClient } from "@/lib/sanity";
import { STARTUPS_BY_AUTHOR_QUERY } from "@foundrly/shared/queries";
import type { Author, Startup } from "@foundrly/shared";

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const { data: author, isLoading } = useQuery({
    queryKey: ["author", id],
    queryFn: () =>
      sanityClient.fetch<Author>(
        `*[_type == "author" && _id == $id][0]{ _id, name, username, image, bio }`,
        { id },
      ),
  });

  const { data: startups } = useQuery({
    queryKey: ["author-startups", id],
    queryFn: () =>
      sanityClient.fetch<Startup[]>(STARTUPS_BY_AUTHOR_QUERY, { id }),
    enabled: !!id,
  });

  const followMutation = async () => {
    if (!user) return;
    await apiFetch("/api/follow", {
      method: "POST",
      body: JSON.stringify({
        profileId: id,
        currentUserId: user.id,
        action: "follow",
      }),
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View className="items-center p-6">
        {author?.image && (
          <Image source={{ uri: author.image }} className="h-24 w-24 rounded-full" />
        )}
        <Text className="mt-3 text-2xl font-bold">{author?.name}</Text>
        <Text className="text-gray-500">@{author?.username}</Text>
        {author?.bio && <Text className="mt-2 text-center">{author.bio}</Text>}
        {user && user.id !== id && (
          <Pressable onPress={followMutation} className="mt-4 rounded-lg bg-primary px-6 py-2">
            <Text className="text-white">Follow</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={startups ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <StartupCard startup={item} />}
        contentContainerClassName="px-4 pb-24"
        ListHeaderComponent={<Text className="mb-2 text-lg font-bold">Startups</Text>}
      />
    </AppShell>
  );
}
