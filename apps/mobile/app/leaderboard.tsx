import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { FlatList, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { sanityClient } from "@/lib/sanity";

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
        contentContainerClassName="p-4 pb-24"
        renderItem={({ item, index }: any) => (
          <View className="mb-2 flex-row items-center rounded-lg border border-gray-100 p-3">
            <Text className="w-8 text-lg font-bold text-primary">{index + 1}</Text>
            {item.image && (
              <Image source={{ uri: item.image }} className="mr-3 h-10 w-10 rounded-full" />
            )}
            <View className="flex-1">
              <Text className="font-semibold">{item.name || item.username}</Text>
              <Text className="text-sm text-gray-500">{item.badgeCount} badges</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-center text-gray-500">No leaderboard data</Text>
          ) : null
        }
      />
    </AppShell>
  );
}
