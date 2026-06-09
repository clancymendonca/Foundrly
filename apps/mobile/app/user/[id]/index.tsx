import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BadgeLabels } from "@/components/badges/BadgeLabels";
import { AppShell } from "@/components/layout/AppShell";
import { FollowUnfollowButton } from "@/components/profile/FollowUnfollowButton";
import { UserSaveButton } from "@/components/profile/UserSaveButton";
import { StartupCard } from "@/components/startup/StartupCard";
import { NeoCard } from "@/components/ui/NeoCard";
import { ProfileTitleBadge } from "@/components/ui/ProfileTitleBadge";
import { useAuth } from "@/lib/auth-context";
import { sanityClient } from "@/lib/sanity";
import { theme, typography } from "@/lib/theme";
import {
  AUTHOR_BY_ID_QUERY,
  STARTUPS_BY_AUTHOR_QUERY,
} from "@foundrly/shared/queries";
import type { Startup } from "@foundrly/shared";

type ProfileAuthor = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
  followers?: { _id: string }[];
  following?: { _id: string }[];
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [followers, setFollowers] = useState<{ _id: string }[]>([]);
  const [following, setFollowing] = useState<{ _id: string }[]>([]);

  const { data: author, isLoading } = useQuery({
    queryKey: ["author", id],
    queryFn: () =>
      sanityClient.fetch<ProfileAuthor>(AUTHOR_BY_ID_QUERY, { id }),
    enabled: !!id,
  });

  const { data: startups } = useQuery({
    queryKey: ["author-startups", id],
    queryFn: () =>
      sanityClient.fetch<Startup[]>(STARTUPS_BY_AUTHOR_QUERY, { id }),
    enabled: !!id,
  });

  const { data: badges } = useQuery({
    queryKey: ["profile-badges", id],
    queryFn: () =>
      sanityClient.fetch(
        `*[_type == "userBadge" && user._ref == $userId]{
          badge->{ _id, name, description, category, rarity, tier }
        }[badge.isActive == true] | order(earnedAt desc)`,
        { userId: id },
      ),
    enabled: !!id,
  });

  const displayFollowers = followers.length
    ? followers
    : (author?.followers ?? []);
  const displayFollowing = following.length
    ? following
    : (author?.following ?? []);

  const isOwnProfile = user?.id === id;
  const badgeList =
    (badges as any[])?.map((b) => b.badge).filter(Boolean) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FlatList
        data={startups ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <StartupCard startup={item} />
          </View>
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.profileContainer}>
            <NeoCard
              shadow="100"
              backgroundColor={theme.primary}
              borderRadius={30}
              style={styles.profileCardWrap}
              contentStyle={styles.profileCard}
            >
              <ProfileTitleBadge name={author?.name} />

              {author?.image ? (
                <Image
                  source={{ uri: author.image }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImageFallback}>
                  <Text style={styles.profileLetter}>
                    {author?.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}

              <Text style={styles.username}>@{author?.username}</Text>
              {author?.bio ? (
                <Text style={styles.bio}>{author.bio}</Text>
              ) : null}

              {badgeList.length > 0 && (
                <BadgeLabels badges={badgeList} maxDisplay={6} />
              )}

              <View style={styles.followCounts}>
                <Text style={styles.followText}>
                  {displayFollowers.length} followers
                </Text>
                <Text style={styles.followDot}>·</Text>
                <Text style={styles.followText}>
                  {displayFollowing.length} following
                </Text>
              </View>

              <FollowUnfollowButton
                profileId={id}
                currentUserId={user?.id}
                followers={displayFollowers}
                onFollowChange={(f, g) => {
                  setFollowers(f);
                  setFollowing(g);
                }}
              />
            </NeoCard>

            <View style={styles.startupsHeader}>
              <Text style={styles.startupsTitle}>
                {isOwnProfile ? "Your" : "All"} Startups
              </Text>
              <UserSaveButton profileId={id} currentUserId={user?.id} />
            </View>
          </View>
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: {
    paddingBottom: theme.tabBarHeight + 24,
  },
  profileContainer: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 40,
  },
  profileCardWrap: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  profileCard: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 24,
    borderRadius: 30,
  },
  profileImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: theme.black,
  },
  profileImageFallback: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: theme.black,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  profileLetter: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 64,
    color: theme.gray600,
  },
  username: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: 30,
    marginTop: 28,
    color: theme.white,
    textAlign: "center",
  },
  bio: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(247, 247, 247, 0.8)",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  followCounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  followText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.white,
  },
  followDot: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.white,
  },
  startupsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startupsTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 30,
    color: theme.black,
  },
  cardItem: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
});
