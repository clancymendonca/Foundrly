import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/auth-context";
import { sanityClient } from "@/lib/sanity";

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
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item: any) => item._id}
          contentContainerClassName="p-4 pb-24"
          renderItem={({ item }: any) => (
            <View className="mb-3 rounded-lg border border-gray-100 p-4">
              <Text className="text-lg font-bold">{item.badge?.name}</Text>
              <Text className="text-gray-600">{item.badge?.description}</Text>
              <Text className="mt-1 text-xs text-primary">{item.badge?.tier}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500">No badges yet</Text>
          }
        />
      )}
    </AppShell>
  );
}
