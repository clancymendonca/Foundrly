import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";

export default function ActivityInteractionsScreen() {
  const { data } = useQuery({
    queryKey: ["activity-interactions"],
    queryFn: () => apiFetch<any>("/api/user/account-history"),
  });

  const items = data?.history ?? data ?? [];

  return (
    <AppShell>
      <MobilePageHeader title="Interactions" backHref="/activity" />
      <FlatList
        data={Array.isArray(items) ? items : []}
        keyExtractor={(item: any, i) => item._id || String(i)}
        contentContainerClassName="p-4 pb-24"
        renderItem={({ item }: any) => (
          <View className="mb-2 rounded-lg border border-gray-100 p-3">
            <Text className="font-medium">{item.action || item.type || "Activity"}</Text>
            <Text className="text-sm text-gray-500">{item.description || item.details}</Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-center text-gray-500">No interactions yet</Text>}
      />
    </AppShell>
  );
}
