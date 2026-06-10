import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Markdown from "react-native-markdown-display";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { StartupEditButton } from "@/components/startup/StartupDetailActions";
import { StartupDetailLikes } from "@/components/startup/StartupDetailLikes";
import { PatternOverlay } from "@/components/ui/PatternOverlay";
import { TagTri } from "@/components/ui/TagTri";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format-date";
import { urlForImage } from "@/lib/sanity";
import { startupDetailMarkdownStyles } from "@/lib/markdown-styles";
import { theme, typography } from "@/lib/theme";
import type { Startup } from "@foundrly/shared";

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startup", id],
    queryFn: () => apiFetch<Startup>(`/api/startups/${id}`),
  });

  if (isLoading || !startup) {
    return (
      <AppShell hideHeader>
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      </AppShell>
    );
  }

  const imageUri = urlForImage(startup.image || "");
  const authorId = startup.author?._id;
  const isOwner = user?.id === authorId;

  return (
    <AppShell hideHeader>
      <View style={styles.screen}>
        <MobilePageHeader
          title={startup.title || "Startup"}
          rightAction={
            isOwner ? (
              <StartupEditButton
                startupId={startup._id}
                isOwner={isOwner}
                variant="icon"
              />
            ) : undefined
          }
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
        <View style={styles.hero}>
          <PatternOverlay />
          <TagTri>{formatDate(startup._createdAt)}</TagTri>
          <View style={styles.headingPill}>
            <Text style={styles.heading}>{startup.title || "Untitled"}</Text>
          </View>
          <Text style={styles.subHeading}>
            {startup.description || "No description provided."}
          </Text>
          <StartupDetailLikes
            startupId={startup._id}
            userId={user?.id}
            isLoggedIn={!!user}
          />
        </View>

        <View style={styles.section}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.mainImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          <View style={styles.authorBlock}>
            {authorId ? (
              <Link href={`/user/${authorId}` as any} asChild>
                <Pressable style={styles.authorRow}>
                  {startup.author?.image ? (
                    <Image
                      source={{ uri: startup.author.image }}
                      style={styles.authorAvatar}
                    />
                  ) : (
                    <View style={styles.authorAvatarFallback}>
                      <Text style={styles.authorLetter}>
                        {startup.author?.name?.[0] ?? "?"}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.authorName}>
                      {startup.author?.name || "Unknown"}
                    </Text>
                    <Text style={styles.authorHandle}>
                      @{startup.author?.username || "unknown"}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ) : null}
            <Text style={styles.categoryTag}>
              {startup.category || "Uncategorized"}
            </Text>
          </View>

          <Text style={styles.pitchTitle}>Pitch Details</Text>
          {startup.pitch ? (
            <View style={styles.pitchContent}>
              <Markdown style={startupDetailMarkdownStyles}>
                {startup.pitch}
              </Markdown>
            </View>
          ) : (
            <Text style={styles.noResult}>No details provided</Text>
          )}

          <View style={styles.divider} />

          <CommentsSection startupId={startup._id} />
        </View>
        </ScrollView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: theme.tabBarHeight + 24 },
  loader: { marginTop: 32 },
  hero: {
    minHeight: 230,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    overflow: "hidden",
  },
  headingPill: {
    backgroundColor: theme.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginVertical: 20,
    maxWidth: "100%",
  },
  heading: {
    ...typography.heading,
    textAlign: "center",
  },
  subHeading: {
    ...typography.subHeading,
    maxWidth: 640,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 896,
    alignSelf: "center",
    width: "100%",
  },
  mainImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    backgroundColor: theme.gray200,
  },
  authorBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    gap: 16,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  authorAvatar: { width: 64, height: 64, borderRadius: 32 },
  authorAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  authorLetter: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    color: theme.gray600,
  },
  authorName: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 20,
    color: theme.black,
  },
  authorHandle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black300,
  },
  categoryTag: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    backgroundColor: "#BBFBFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pitchTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 28,
    marginTop: 40,
    marginBottom: 12,
    color: theme.black,
  },
  pitchContent: {
    backgroundColor: theme.gray100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  noResult: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.black100,
  },
  divider: {
    marginTop: 40,
    borderTopWidth: 2,
    borderStyle: "dotted",
    borderColor: theme.gray500,
    opacity: 0.4,
  },
});
