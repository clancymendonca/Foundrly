import { useQuery } from "@tanstack/react-query";
import { FlatList, Text } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";

export default function AccountHistoryScreen() {
  const { data } = useQuery({
    queryKey: ["account-history"],
    queryFn: () => apiFetch<any>("/api/user/account-history"),
  });

  const items = data?.history ?? [];

  return (
    <AppShell>
      <MobilePageHeader title="Account History" backHref="/activity" />
      <FlatList
        data={Array.isArray(items) ? items : []}
        keyExtractor={(item: any, i) => item._id || String(i)}
        contentContainerClassName="p-4 pb-24"
        renderItem={({ item }: any) => (
          <Text className="mb-2 rounded-lg border border-gray-100 p-3">
            {item.description || item.action || JSON.stringify(item)}
          </Text>
        )}
        ListEmptyComponent={<Text className="text-center text-gray-500">No history</Text>}
      />
    </AppShell>
  );
}
