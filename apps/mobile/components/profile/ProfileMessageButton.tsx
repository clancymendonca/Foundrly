import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { openMessageThread } from "@/lib/channel-routing";
import { upsertAndCreateChannel } from "@/lib/chat-utils";
import { theme } from "@/lib/theme";

export function ProfileMessageButton({
  profileId,
  profileName,
  profileUsername,
  profileImage,
  currentUserId,
}: {
  profileId: string;
  profileName?: string;
  profileUsername?: string;
  profileImage?: string;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!currentUserId || profileId === currentUserId) return null;

  const handlePress = async () => {
    setLoading(true);
    try {
      const channelId = await upsertAndCreateChannel(currentUserId, {
        _id: profileId,
        name: profileName || profileUsername || "Founder",
        username: profileUsername || profileId,
        image: profileImage,
      });
      openMessageThread(router, channelId);
    } catch {
      Toast.show({
        type: "error",
        text1: "Could not open conversation",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.white} size="small" />
      ) : (
        <>
          <Ionicons name="chatbubble-outline" size={18} color={theme.white} />
          <Text style={styles.label}>Message</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.black,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: theme.white,
  },
  buttonDisabled: { opacity: 0.7 },
  label: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.white,
  },
});
