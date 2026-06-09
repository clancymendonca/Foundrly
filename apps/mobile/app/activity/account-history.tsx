import { useQuery } from "@tanstack/react-query";
import { FlatList, Text } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { screenStyles } from "@/lib/screen-styles";

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
        contentContainerStyle={screenStyles.listContent}
        renderItem={({ item }: any) => (
          <Text style={screenStyles.card}>
            {item.description || item.action || JSON.stringify(item)}
          </Text>
        )}
        ListEmptyComponent={<Text style={screenStyles.empty}>No history</Text>}
      />
    </AppShell>
  );
}
