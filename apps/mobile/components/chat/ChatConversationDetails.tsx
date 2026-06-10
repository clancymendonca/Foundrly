import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Channel, LocalMessage } from "stream-chat";
import Toast from "react-native-toast-message";
import { BadgeLabels } from "@/components/badges/BadgeLabels";
import { fetchUserBadges, rowsToLeveledBadges } from "@/lib/badge-queries";
import { selectProfileBadges } from "@/lib/badges";
import { NeoCard } from "@/components/ui/NeoCard";
import { ChatAvatar } from "./ChatAvatar";
import { ConversationMediaGrid } from "./ConversationMediaGrid";
import { useChannelNotifications } from "@/hooks/use-channel-notifications";
import { useConversationMedia } from "@/hooks/use-conversation-media";
import { usePeerPresence } from "@/hooks/use-peer-presence";
import { resolveDisplayImageUrl } from "@/lib/chat-utils";
import { formatLastSeen } from "@/lib/format-chat-time";
import { sanityClient } from "@/lib/sanity";
import { theme } from "@/lib/theme";
import {
  AUTHOR_BY_ID_QUERY,
  STARTUPS_BY_AUTHOR_QUERY,
} from "@foundrly/shared/queries";

type MediaTab = "photos" | "files";

function QuickAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.quickAction, disabled && styles.quickActionDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  subtext,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtext?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingsIconWrap}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingsTextWrap}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtext ? <Text style={styles.settingsSubtext}>{subtext}</Text> : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.gray500} />
      ) : null}
    </Pressable>
  );
}

function SettingsToggleRow({
  icon,
  label,
  subtext,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtext?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsIconWrap}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingsTextWrap}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtext ? <Text style={styles.settingsSubtext}>{subtext}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.gray200, true: theme.primary }}
        thumbColor={theme.white}
      />
    </View>
  );
}

export function ChatConversationDetails({
  visible,
  onClose,
  channel,
  messages,
  otherUserId,
  otherUserName,
  otherUserImage,
  otherUsername,
  moderationEnabled,
  onModerationChange,
}: {
  visible: boolean;
  onClose: () => void;
  channel: Channel | null;
  messages: LocalMessage[];
  otherUserId: string | null;
  otherUserName: string;
  otherUserImage?: string;
  otherUsername?: string;
  moderationEnabled: boolean;
  onModerationChange: (enabled: boolean) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mediaTab, setMediaTab] = useState<MediaTab>("photos");
  const [moreOpen, setMoreOpen] = useState(false);

  const { muted, toggleMute } = useChannelNotifications(channel);
  const { photos, files } = useConversationMedia(messages);
  const { online, lastActive } = usePeerPresence(channel, otherUserId);

  const { data: author } = useQuery({
    queryKey: ["conversation-author", otherUserId],
    queryFn: () =>
      sanityClient.fetch<{
        _id: string;
        name?: string;
        username?: string;
        bio?: string;
        image?: string;
      }>(AUTHOR_BY_ID_QUERY, { id: otherUserId }),
    enabled: visible && !!otherUserId,
  });

  const { data: startups } = useQuery({
    queryKey: ["conversation-startups", otherUserId],
    queryFn: () =>
      sanityClient.fetch<unknown[]>(STARTUPS_BY_AUTHOR_QUERY, {
        id: otherUserId,
      }),
    enabled: visible && !!otherUserId,
  });

  const { data: badges } = useQuery({
    queryKey: ["conversation-badges", otherUserId],
    queryFn: () => fetchUserBadges(otherUserId!),
    enabled: visible && !!otherUserId,
  });

  const username =
    otherUsername || author?.username || otherUserId || "founder";
  const badgeList = selectProfileBadges(rowsToLeveledBadges(badges ?? []));
  const startupCount = startups?.length ?? 0;
  const presenceLabel = online
    ? "Online"
    : formatLastSeen(lastActive) ?? undefined;
  const heroImageUrl = resolveDisplayImageUrl(
    otherUserImage ?? author?.image,
  );
  const heroInitial = otherUserName?.[0]?.toUpperCase() || "?";

  const openProfile = () => {
    if (!otherUserId) return;
    onClose();
    router.push(`/user/${otherUserId}` as never);
  };

  const copyUsername = async () => {
    await Clipboard.setStringAsync(`@${username}`);
    Toast.show({ type: "success", text1: "Username copied" });
    setMoreOpen(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={theme.black} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            {heroImageUrl ? (
              <Image
                source={{ uri: heroImageUrl }}
                style={styles.heroBgImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.heroFallbackBg}>
                <Text style={styles.heroFallbackInitial}>{heroInitial}</Text>
              </View>
            )}
            <View style={styles.heroOverlay} />

            <View style={styles.heroContent}>
              <ChatAvatar
                imageUrl={otherUserImage}
                name={otherUserName}
                size={88}
                online={online}
                shape="rounded-square"
                style={styles.heroAvatar}
              />
              <Text style={styles.heroName}>{otherUserName}</Text>
              <Text style={styles.heroUsername}>@{username}</Text>
              {presenceLabel ? (
                <View style={styles.presencePill}>
                  <View
                    style={[
                      styles.activeDot,
                      online ? styles.activeDotOnline : styles.activeDotRecent,
                    ]}
                  />
                  <Text style={styles.presenceText}>{presenceLabel}</Text>
                </View>
              ) : null}
              {author?.bio ? (
                <Text style={styles.bio} numberOfLines={2}>
                  {author.bio}
                </Text>
              ) : null}
              {badgeList.length > 0 && (
                <View style={styles.badgesWrap}>
                  <BadgeLabels
                    badges={badgeList}
                    maxDisplay={4}
                    userId={otherUserId ?? undefined}
                  />
                </View>
              )}
            </View>

            <View style={styles.quickActions}>
              <QuickAction icon="person-outline" label="Profile" onPress={openProfile} />
              <QuickAction
                icon="search-outline"
                label="Search"
                disabled
                onPress={() =>
                  Toast.show({ type: "info", text1: "Search coming soon" })
                }
              />
              <QuickAction
                icon={muted ? "notifications-off-outline" : "notifications-outline"}
                label={muted ? "Unmute" : "Mute"}
                onPress={toggleMute}
              />
              <QuickAction
                icon="ellipsis-horizontal"
                label="More"
                onPress={() => setMoreOpen(true)}
              />
            </View>
          </View>

          <View style={styles.cardWrap}>
            <NeoCard shadow="200" borderRadius={20} contentStyle={styles.cardContent}>
              <SettingsToggleRow
                icon="shield-checkmark-outline"
                label="Message moderation"
                subtext={
                  moderationEnabled
                    ? "Outgoing messages are scanned before sending"
                    : "Moderation off for this chat"
                }
                value={moderationEnabled}
                onValueChange={onModerationChange}
              />
              <SettingsRow
                icon="rocket-outline"
                label="Their pitches"
                subtext={
                  startupCount === 1
                    ? "1 startup"
                    : `${startupCount} startups`
                }
                onPress={openProfile}
              />
            </NeoCard>
          </View>

          <View style={styles.mediaTabs}>
            <Pressable
              style={[styles.mediaTab, mediaTab === "photos" && styles.mediaTabActive]}
              onPress={() => setMediaTab("photos")}
            >
              <Ionicons
                name="images-outline"
                size={20}
                color={mediaTab === "photos" ? theme.black : theme.gray500}
              />
              <Text
                style={[
                  styles.mediaTabText,
                  mediaTab === "photos" && styles.mediaTabTextActive,
                ]}
              >
                Photos
              </Text>
            </Pressable>
            <Pressable
              style={[styles.mediaTab, mediaTab === "files" && styles.mediaTabActive]}
              onPress={() => setMediaTab("files")}
            >
              <Ionicons
                name="folder-outline"
                size={20}
                color={mediaTab === "files" ? theme.black : theme.gray500}
              />
              <Text
                style={[
                  styles.mediaTabText,
                  mediaTab === "files" && styles.mediaTabTextActive,
                ]}
              >
                Files
              </Text>
            </Pressable>
          </View>

          <ConversationMediaGrid
            items={mediaTab === "photos" ? photos : files}
            emptyLabel={
              mediaTab === "photos"
                ? "No photos shared yet"
                : "No files shared yet"
            }
          />
        </ScrollView>

        <Modal
          visible={moreOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMoreOpen(false)}
        >
          <Pressable style={styles.moreOverlay} onPress={() => setMoreOpen(false)}>
            <View style={styles.moreSheet}>
              <Pressable style={styles.moreRow} onPress={copyUsername}>
                <Ionicons name="copy-outline" size={20} color={theme.black} />
                <Text style={styles.moreText}>Copy username</Text>
              </Pressable>
              <Pressable style={styles.moreRow} onPress={() => setMoreOpen(false)}>
                <Text style={styles.moreCancel}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.white },
  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 4, alignSelf: "flex-start" },
  scroll: { flex: 1 },
  heroBlock: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: theme.black,
    overflow: "hidden",
    position: "relative",
  },
  heroBgImage: {
    ...StyleSheet.absoluteFill,
  },
  heroFallbackBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackInitial: {
    fontFamily: theme.fontFamily.black,
    fontSize: 120,
    color: "rgba(255,255,255,0.25)",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
    zIndex: 1,
  },
  heroAvatar: {
    borderWidth: 4,
    borderColor: theme.white,
  },
  heroName: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    color: theme.white,
    marginTop: 14,
    textAlign: "center",
  },
  heroUsername: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  presencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: theme.black,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDotOnline: {
    backgroundColor: theme.green500,
    borderWidth: 2,
    borderColor: theme.white,
  },
  activeDotRecent: {
    backgroundColor: theme.green500,
  },
  presenceText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.gray700,
  },
  bio: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  badgesWrap: { marginTop: 10 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 1,
  },
  quickAction: { alignItems: "center", gap: 6, width: 72 },
  quickActionDisabled: { opacity: 0.45 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.black,
  },
  quickActionLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: theme.white,
    textAlign: "center",
  },
  cardWrap: { paddingHorizontal: 16, marginBottom: 20 },
  cardContent: { paddingVertical: 8, paddingHorizontal: 4, gap: 0 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary100,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTextWrap: { flex: 1 },
  settingsLabel: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 15,
    color: theme.black,
  },
  settingsSubtext: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.gray500,
    marginTop: 2,
  },
  mediaTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  mediaTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  mediaTabActive: { borderBottomColor: theme.black },
  mediaTabText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.gray500,
  },
  mediaTabTextActive: { color: theme.black },
  moreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 4,
    borderColor: theme.black,
    padding: 16,
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  moreText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
  },
  moreCancel: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.gray600,
    textAlign: "center",
    flex: 1,
  },
});
