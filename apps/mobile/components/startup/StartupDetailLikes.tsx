import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStartupEngagement } from "@/hooks/useStartupEngagement";
import { theme } from "@/lib/theme";

export function StartupDetailLikes({
  startupId,
  userId,
  isLoggedIn,
}: {
  startupId: string;
  userId?: string;
  isLoggedIn: boolean;
}) {
  const engagement = useStartupEngagement(startupId, userId);

  if (engagement.initialLoading) {
    return (
      <ActivityIndicator
        style={styles.loader}
        color={theme.gray500}
        size="large"
      />
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, engagement.liked && styles.btnLiked]}
        onPress={engagement.toggleLike}
        disabled={!isLoggedIn || engagement.likeLoading}
      >
        {engagement.likeLoading ? (
          <ActivityIndicator color={theme.green600} size="small" />
        ) : (
          <>
            <Ionicons
              name="thumbs-up-outline"
              size={20}
              color={engagement.liked ? theme.green700 : theme.gray600}
            />
            <Text
              style={[
                styles.label,
                engagement.liked && styles.labelLiked,
              ]}
            >
              Likes
            </Text>
          </>
        )}
        <Text style={[styles.count, engagement.liked && styles.labelLiked]}>
          {engagement.likes}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btn, engagement.disliked && styles.btnDisliked]}
        onPress={engagement.toggleDislike}
        disabled={!isLoggedIn || engagement.dislikeLoading}
      >
        {engagement.dislikeLoading ? (
          <ActivityIndicator color={theme.red600} size="small" />
        ) : (
          <>
            <Ionicons
              name="thumbs-down-outline"
              size={20}
              color={engagement.disliked ? theme.red600 : theme.gray600}
            />
            <Text
              style={[
                styles.label,
                engagement.disliked && styles.labelDisliked,
              ]}
            >
              Dislikes
            </Text>
          </>
        )}
        <Text
          style={[styles.count, engagement.disliked && styles.labelDisliked]}
        >
          {engagement.dislikes}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 16 },
  row: { flexDirection: "row", gap: 16, marginTop: 16 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.gray100,
  },
  btnLiked: { backgroundColor: "#DCFCE7" },
  btnDisliked: { backgroundColor: "#FEE2E2" },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.green700,
  },
  labelLiked: { color: theme.green700 },
  labelDisliked: { color: theme.red600 },
  count: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.gray600,
  },
});
