import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { screenStyles } from "@/lib/screen-styles";

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
        contentContainerStyle={screenStyles.listContent}
        renderItem={({ item }: any) => (
          <View style={screenStyles.card}>
            <Text style={screenStyles.cardTitle}>
              {item.action || item.type || "Activity"}
            </Text>
            <Text style={screenStyles.cardDesc}>
              {item.description || item.details}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={screenStyles.empty}>No interactions yet</Text>
        }
      />
    </AppShell>
  );
}
