import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const storageKey = (channelId: string) =>
  `foundrly_chat_moderation_${channelId}`;

export function useChatModerationPref(channelId: string | null | undefined) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!channelId) {
      setEnabled(true);
      setLoaded(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey(channelId));
        if (!cancelled) {
          setEnabled(stored !== "false");
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEnabled(true);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const setModerationEnabled = useCallback(
    async (value: boolean) => {
      if (!channelId) return;
      setEnabled(value);
      await AsyncStorage.setItem(storageKey(channelId), value ? "true" : "false");
    },
    [channelId],
  );

  return { enabled, loaded, setModerationEnabled };
}
