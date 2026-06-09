import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api-client";
import { theme } from "@/lib/theme";

export function UserSaveButton({
  profileId,
  currentUserId,
}: {
  profileId: string;
  currentUserId?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || profileId === currentUserId) return;
    apiFetch<{ success?: boolean; saved: boolean }>(
      `/api/saved-user?profileId=${encodeURIComponent(profileId)}`,
    )
      .then((data) => {
        if (data.success) setSaved(!!data.saved);
      })
      .catch(() => {});
  }, [profileId, currentUserId]);

  const handleToggle = async () => {
    if (!currentUserId || loading || profileId === currentUserId) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ success?: boolean; saved: boolean }>(
        `/api/saved-user?profileId=${encodeURIComponent(profileId)}`,
        { method: "POST" },
      );
      if (data.success) setSaved(!!data.saved);
    } catch {}
    setLoading(false);
  };

  if (!currentUserId || profileId === currentUserId) return null;

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      style={[
        styles.btn,
        saved && styles.btnSaved,
        loading && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={saved ? theme.white : theme.gray500} />
      ) : (
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={20}
          color={saved ? theme.white : theme.gray500}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.gray200,
    backgroundColor: theme.white,
  },
  btnSaved: {
    backgroundColor: theme.blue500,
    borderColor: theme.blue500,
  },
  btnDisabled: { opacity: 0.75 },
});
