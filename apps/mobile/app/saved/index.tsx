import { useQuery } from "@tanstack/react-query";
import { FlatList, Text } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { StartupCard } from "@/components/startup/StartupCard";
import { apiFetch } from "@/lib/api-client";
import { screenStyles } from "@/lib/screen-styles";
import type { Startup } from "@foundrly/shared";

export default function SavedScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-startups"],
    queryFn: () => apiFetch<{ startups: Startup[] }>("/api/saved-startups"),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Saved" />
      <FlatList
        data={data?.startups ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={screenStyles.listContent}
        renderItem={({ item }) => <StartupCard startup={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={screenStyles.empty}>No saved startups</Text>
          ) : null
        }
      />
    </AppShell>
  );
}
