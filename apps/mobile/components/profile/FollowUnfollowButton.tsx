import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import Toast from "react-native-toast-message";
import { apiFetch } from "@/lib/api-client";
import { theme } from "@/lib/theme";

export function FollowUnfollowButton({
  profileId,
  currentUserId,
  followers = [],
  onFollowChange,
}: {
  profileId: string;
  currentUserId?: string;
  followers?: { _id: string }[];
  onFollowChange?: (followers: any[], following: any[]) => void;
}) {
  const isFollowing =
    !!currentUserId &&
    followers.some((f) => f._id === currentUserId);
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  const handleToggle = useCallback(async () => {
    if (!profileId || !currentUserId) return;
    setLoading(true);
    const action = following ? "unfollow" : "follow";
    setFollowing((f) => !f);

    try {
      const data = await apiFetch<{
        success?: boolean;
        followers?: any[];
        following?: any[];
        message?: string;
      }>("/api/follow", {
        method: "POST",
        body: JSON.stringify({ profileId, currentUserId, action }),
      });

      if (data.success === false) {
        setFollowing((f) => !f);
        Toast.show({ type: "error", text1: data.message ?? "Failed" });
      } else {
        onFollowChange?.(data.followers ?? [], data.following ?? []);
        Toast.show({
          type: "success",
          text1: action === "follow" ? "Followed successfully" : "Unfollowed",
        });
      }
    } catch {
      setFollowing((f) => !f);
      Toast.show({ type: "error", text1: "Failed to update follow status" });
    } finally {
      setLoading(false);
    }
  }, [profileId, currentUserId, following, onFollowChange]);

  if (!currentUserId || profileId === currentUserId) return null;

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      style={[styles.btn, following && styles.btnFollowing]}
    >
      {loading ? (
        <ActivityIndicator color={theme.black} size="small" />
      ) : (
        <Text style={styles.text}>
          {following ? "Unfollow" : "Follow"}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: 16,
    minWidth: 120,
    borderWidth: 5,
    borderColor: theme.black,
    borderRadius: 999,
    backgroundColor: theme.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnFollowing: {
    backgroundColor: theme.primary100,
  },
  text: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.black,
  },
});
