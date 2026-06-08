import { useQuery } from "@tanstack/react-query";
import { FlatList, Text } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { StartupCard } from "@/components/startup/StartupCard";
import { apiFetch } from "@/lib/api-client";
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
        contentContainerClassName="p-4 pb-24"
        renderItem={({ item }) => <StartupCard startup={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-center text-gray-500">No saved startups</Text>
          ) : null
        }
      />
    </AppShell>
  );
}
