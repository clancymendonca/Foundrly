import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, FlatList, StyleSheet, Text } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

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
      apiFetch("/api/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Notifications" />
      <Pressable onPress={() => markAllRead.mutate()} style={styles.markAll}>
        <Text style={styles.markAllText}>Mark all read</Text>
      </Pressable>
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(item: any) => item._id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={screenStyles.listContent}
        renderItem={({ item }: any) => (
          <Pressable
            onPress={() => markRead.mutate(item._id)}
            style={[screenStyles.card, !item.read && styles.unread]}
          >
            <Text style={screenStyles.cardTitle}>{item.title || item.type}</Text>
            <Text style={screenStyles.cardDesc}>{item.message}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={screenStyles.empty}>No notifications</Text>
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  markAll: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    paddingVertical: 8,
  },
  markAllText: {
    textAlign: "center",
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.primary,
  },
  unread: {
    borderColor: "rgba(78, 113, 255, 0.3)",
    backgroundColor: "rgba(78, 113, 255, 0.05)",
  },
});
