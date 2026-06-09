import { Link } from "expo-router";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InterestedModal } from "@/components/interested/InterestedModal";
import { NeoCard } from "@/components/ui/NeoCard";
import { useStartupEngagement } from "@/hooks/useStartupEngagement";
import { formatDate } from "@/lib/format-date";
import { STARTUP_IMAGE_PLACEHOLDER } from "@/lib/image-fallback";
import { urlForImage } from "@/lib/sanity";
import { theme, typography } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import type { Startup } from "@foundrly/shared";

export function StartupCard({ startup }: { startup: Startup }) {
  const { user } = useAuth();
  const userId = user?.id;
  const isLoggedIn = !!user;
  const engagement = useStartupEngagement(startup._id, userId);
  const [imageSrc, setImageSrc] = useState(
    urlForImage(startup.image || "") || "",
  );
  const [interestedModalOpen, setInterestedModalOpen] = useState(false);
  const [interestedOverride, setInterestedOverride] = useState(false);

  const authorId = startup.author?._id;
  const isInterested = engagement.interested || interestedOverride;

  return (
    <NeoCard style={styles.cardWrap} contentStyle={styles.cardInner}>
      <View style={styles.topRow}>
        <Text style={styles.datePill}>{formatDate(startup._createdAt)}</Text>
        <View style={styles.viewsRow}>
          <Ionicons name="eye-outline" size={22} color={theme.primary} />
          <Text style={styles.viewsText}>
            {engagement.initialLoading ? "..." : engagement.views}
          </Text>
        </View>
      </View>

      <View style={styles.authorRow}>
        <View style={styles.authorInfo}>
          {authorId ? (
            <Link href={`/user/${authorId}` as any} asChild>
              <Pressable>
                <Text style={styles.authorName} numberOfLines={1}>
                  {startup.author?.name ?? "Unknown"}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text style={styles.authorName} numberOfLines={1}>
              {startup.author?.name ?? "Unknown"}
            </Text>
          )}
          <Link href={`/startup/${startup._id}` as any} asChild>
            <Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {startup.title}
              </Text>
            </Pressable>
          </Link>
        </View>
        {authorId ? (
          <Link href={`/user/${authorId}` as any} asChild>
            <Pressable>
              {startup.author?.image ? (
                <Image
                  source={{ uri: startup.author.image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {startup.author?.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>?</Text>
          </View>
        )}
      </View>

      <Link href={`/startup/${startup._id}` as any} asChild>
        <Pressable>
          <Text style={styles.description} numberOfLines={2}>
            {startup.description}
          </Text>
          {imageSrc ? (
            <Image
              source={{ uri: imageSrc }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImageSrc(STARTUP_IMAGE_PLACEHOLDER)}
            />
          ) : null}
        </Pressable>
      </Link>

      {engagement.initialLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.engagementRow}>
          <View style={styles.engagementLeft}>
            <EngagementButton
              icon="thumbs-up"
              count={engagement.likes}
              active={engagement.liked}
              activeColor={theme.green500}
              disabled={!isLoggedIn || engagement.likeLoading}
              loading={engagement.likeLoading}
              onPress={engagement.toggleLike}
            />
            <EngagementButton
              icon="thumbs-down"
              count={engagement.dislikes}
              active={engagement.disliked}
              activeColor={theme.red500}
              disabled={!isLoggedIn || engagement.dislikeLoading}
              loading={engagement.dislikeLoading}
              onPress={engagement.toggleDislike}
            />
          </View>
          <View style={styles.engagementRight}>
            <IconButton
              icon="heart"
              active={isInterested}
              activeColor={theme.purple500}
              disabled={!isLoggedIn || authorId === userId}
              onPress={() => setInterestedModalOpen(true)}
            />
            <IconButton
              icon="bookmark"
              active={engagement.saved}
              activeColor={theme.blue500}
              disabled={!isLoggedIn || engagement.saveLoading}
              loading={engagement.saveLoading}
              onPress={engagement.toggleSave}
            />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.category} numberOfLines={1}>
          {startup.category}
        </Text>
        <Link href={`/startup/${startup._id}` as any} asChild>
          <Pressable style={styles.detailsBtn}>
            <Text style={styles.detailsText}>Details</Text>
          </Pressable>
        </Link>
      </View>

      <InterestedModal
        visible={interestedModalOpen}
        onClose={() => setInterestedModalOpen(false)}
        startupId={startup._id}
        startupTitle={startup.title}
        userId={userId}
        onSuccess={() => setInterestedOverride(true)}
      />
    </NeoCard>
  );
}

function EngagementButton({
  icon,
  count,
  active,
  activeColor,
  disabled,
  loading,
  onPress,
}: {
  icon: "thumbs-up" | "thumbs-down";
  count: number;
  active: boolean;
  activeColor: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const iconName = active
    ? icon === "thumbs-up"
      ? "thumbs-up"
      : "thumbs-down"
    : icon === "thumbs-up"
      ? "thumbs-up-outline"
      : "thumbs-down-outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.engagementBtn,
        active && { backgroundColor: activeColor, borderColor: activeColor },
        disabled && styles.engagementBtnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={active ? theme.white : theme.gray500} />
      ) : (
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={18}
          color={active ? theme.white : theme.gray500}
        />
      )}
      <Text
        style={[
          styles.engagementCount,
          active && { color: theme.white },
        ]}
      >
        {count}
      </Text>
    </Pressable>
  );
}

function IconButton({
  icon,
  active,
  activeColor,
  disabled,
  loading,
  onPress,
}: {
  icon: "heart" | "bookmark";
  active: boolean;
  activeColor: string;
  disabled: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.iconBtn,
        active && { backgroundColor: activeColor, borderColor: activeColor },
        disabled && styles.engagementBtnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={active ? theme.white : theme.gray500} />
      ) : (
        <Ionicons
          name={(active ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap}
          size={18}
          color={active ? theme.white : theme.gray500}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: { marginBottom: 20 },
  cardInner: { paddingVertical: 24, paddingHorizontal: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePill: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
    backgroundColor: theme.primary100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  viewsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  viewsText: { ...typography.text16Medium },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 16,
  },
  authorInfo: { flex: 1 },
  authorName: { ...typography.text16Medium },
  title: { ...typography.text26Semibold, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.gray600,
  },
  description: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: theme.black100,
    marginTop: 12,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 164,
    borderRadius: 10,
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  engagementLeft: { flexDirection: "row", gap: 12 },
  engagementRight: { flexDirection: "row", gap: 12 },
  engagementBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.gray200,
    backgroundColor: theme.white,
  },
  engagementBtnDisabled: { opacity: 0.75 },
  engagementCount: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.gray600,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.gray200,
    backgroundColor: theme.white,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  category: { ...typography.text16Medium, flex: 1 },
  detailsBtn: {
    backgroundColor: theme.black200,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  detailsText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.white,
  },
});
