import { useCallback, useEffect, useState } from "react";
import type { Channel } from "stream-chat";
import Toast from "react-native-toast-message";

export function useChannelNotifications(channel: Channel | null) {
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const syncMuteStatus = useCallback(() => {
    if (!channel) {
      setMuted(false);
      return;
    }

    try {
      const status = channel.muteStatus();
      setMuted(!!status?.muted);
    } catch {
      setMuted(false);
    }
  }, [channel]);

  useEffect(() => {
    if (!channel) {
      setMuted(false);
      return;
    }

    syncMuteStatus();

    const sub = channel.on("notification.channel_mutes_updated", syncMuteStatus);

    return () => sub.unsubscribe();
  }, [channel, syncMuteStatus]);

  const toggleMute = useCallback(async () => {
    if (!channel || loading) return;

    setLoading(true);
    try {
      if (muted) {
        await channel.unmute();
        setMuted(false);
        Toast.show({ type: "success", text1: "Notifications unmuted" });
      } else {
        await channel.mute();
        setMuted(true);
        Toast.show({ type: "success", text1: "Conversation muted" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not update mute setting" });
    } finally {
      setLoading(false);
    }
  }, [channel, loading, muted]);

  return { muted, loading, toggleMute };
}
