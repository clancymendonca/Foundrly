import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, FlatList, Text, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ notifications: any[] }>("/api/notifications"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/mark-read", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Notifications" />
      <Pressable
        onPress={() => markAllRead.mutate()}
        className="mx-4 mb-2 rounded bg-gray-100 py-2"
      >
        <Text className="text-center text-sm text-primary">Mark all read</Text>
      </Pressable>
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(item: any) => item._id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerClassName="px-4 pb-24"
        renderItem={({ item }: any) => (
          <Pressable
            onPress={() => markRead.mutate(item._id)}
            className={`mb-2 rounded-lg border p-4 ${item.read ? "border-gray-100 bg-white" : "border-primary/30 bg-primary/5"}`}
          >
            <Text className="font-medium">{item.title || item.type}</Text>
            <Text className="mt-1 text-sm text-gray-600">{item.message}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-500">No notifications</Text>
        }
      />
    </AppShell>
  );
}
