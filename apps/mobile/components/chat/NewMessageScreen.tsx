import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  type SuggestedContact,
  resolveDisplayImageUrl,
  upsertAndCreateChannel,
} from "@/lib/chat-utils";
import { replaceMessageThread } from "@/lib/channel-routing";
import { useExistingChatPeerIds } from "@/lib/use-existing-chat-peer-ids";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export function NewMessageScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<SuggestedContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const existingPeerIds = useExistingChatPeerIds();

  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        currentUserId: user.id,
        limit: "40",
      });
      const data = await apiFetch<{ users: SuggestedContact[] }>(
        `/api/users/suggested?${params}`,
      );
      setContacts(data.users || []);
    } catch {
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const excludedIds = useMemo(
    () => new Set(existingPeerIds),
    [existingPeerIds],
  );

  const availableContacts = useMemo(
    () => contacts.filter((contact) => !excludedIds.has(contact._id)),
    [contacts, excludedIds],
  );

  const filteredContacts = availableContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleContactSelect = async (contact: SuggestedContact) => {
    if (!user?.id || creatingChat) return;

    setCreatingChat(contact._id);
    try {
      const channelId = await upsertAndCreateChannel(user.id, contact);
      replaceMessageThread(router, channelId);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e instanceof Error ? e.message : "Failed to start chat",
      });
    } finally {
      setCreatingChat(null);
    }
  };

  const getTypeBadge = (type?: string) => {
    if (type === "follower") {
      return <Text style={styles.badgeFollower}>Follows you</Text>;
    }
    if (type === "mutual") {
      return <Text style={styles.badgeMutual}>Mutual</Text>;
    }
    return null;
  };

  if (!user) {
    return (
      <View style={screenStyles.center}>
        <Text style={styles.empty}>Please log in to start a new message</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobilePageHeader title="New message" />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={theme.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username"
          placeholderTextColor={theme.gray500}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <Text style={styles.sectionTitle}>Suggested</Text>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={screenStyles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchTerm
                ? "No contacts found"
                : "No suggested contacts available"}
            </Text>
          }
          renderItem={({ item }) => {
            const avatarUrl = resolveDisplayImageUrl(item.image);
            return (
            <Pressable
              onPress={() => handleContactSelect(item)}
              disabled={creatingChat === item._id}
              style={[
                styles.contactRow,
                creatingChat === item._id && styles.contactRowDisabled,
              ]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {item.name?.[0] || item.username?.[0] || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.contactBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {getTypeBadge(item.type)}
                </View>
                <Text style={styles.username} numberOfLines={1}>
                  @{item.username}
                </Text>
                {item.bio ? (
                  <Text style={styles.bio} numberOfLines={1}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>
              {creatingChat === item._id ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.gray500}
                />
              )}
            </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.white },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.black,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loader: { marginTop: 32 },
  error: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.red600,
    paddingVertical: 24,
  },
  empty: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    paddingVertical: 32,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactRowDisabled: { opacity: 0.5 },
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
  contactBody: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactName: {
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
  bio: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
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
