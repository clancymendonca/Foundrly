import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  type SuggestedContact,
  resolveDisplayImageUrl,
  upsertAndCreateChannel,
} from "@/lib/chat-utils";
import { openMessageThread } from "@/lib/channel-routing";
import { useExistingChatPeerIds } from "@/lib/use-existing-chat-peer-ids";
import { theme } from "@/lib/theme";

interface SuggestedUsersListProps {
  maxResults?: number;
  excludeUserIds?: string[];
  onStartChat?: (channelId: string, contact: SuggestedContact) => void;
}

export function SuggestedUsersList({
  maxResults = 5,
  excludeUserIds = [],
  onStartChat,
}: SuggestedUsersListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const existingPeerIds = useExistingChatPeerIds();
  const [users, setUsers] = useState<SuggestedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        currentUserId: user.id,
        limit: String(Math.max(maxResults * 4, 20)),
      });
      const data = await apiFetch<{ users: SuggestedContact[] }>(
        `/api/users/suggested?${params}`,
      );
      setUsers(data.users || []);
    } catch {
      setError("Failed to load suggested users");
    } finally {
      setLoading(false);
    }
  }, [user?.id, maxResults]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const excludedIds = useMemo(
    () => new Set([...existingPeerIds, ...excludeUserIds]),
    [existingPeerIds, excludeUserIds],
  );

  const visibleUsers = useMemo(
    () =>
      users
        .filter((contact) => !excludedIds.has(contact._id))
        .slice(0, maxResults),
    [users, excludedIds, maxResults],
  );

  const handleUserSelect = async (contact: SuggestedContact) => {
    if (!user?.id || creatingChat) return;

    setCreatingChat(contact._id);
    try {
      const channelId = await upsertAndCreateChannel(user.id, contact);
      if (onStartChat) {
        onStartChat(channelId, contact);
      } else {
        openMessageThread(router, channelId);
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e instanceof Error ? e.message : "Failed to start chat",
      });
    } finally {
      setCreatingChat(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <ActivityIndicator
        color={theme.primary}
        style={styles.loader}
      />
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (visibleUsers.length === 0) {
    return (
      <Text style={styles.empty}>No suggested users available</Text>
    );
  }

  return (
    <View>
      {visibleUsers.map((contact) => {
        const avatarUrl = resolveDisplayImageUrl(contact.image);
        return (
        <Pressable
          key={contact._id}
          onPress={() => handleUserSelect(contact)}
          disabled={creatingChat === contact._id}
          style={[
            styles.row,
            creatingChat === contact._id && styles.rowDisabled,
          ]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {contact.name?.[0] || contact.username?.[0] || "?"}
              </Text>
            </View>
          )}
          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {contact.name}
              </Text>
              {contact.type === "follower" && (
                <Text style={styles.badgeFollower}>Follows you</Text>
              )}
              {contact.type === "mutual" && (
                <Text style={styles.badgeMutual}>Mutual</Text>
              )}
            </View>
            <Text style={styles.username} numberOfLines={1}>
              @{contact.username}
            </Text>
          </View>
          {creatingChat === contact._id ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : null}
        </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 16 },
  error: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.red600,
    paddingVertical: 16,
  },
  empty: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    paddingVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowDisabled: { opacity: 0.5 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.gray600,
  },
  body: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.black,
    flexShrink: 1,
  },
  username: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    marginTop: 2,
  },
  badgeFollower: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 11,
    color: theme.blue500,
  },
  badgeMutual: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 11,
    color: theme.green600,
  },
});
