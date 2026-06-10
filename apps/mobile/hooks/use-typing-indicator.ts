import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "stream-chat";

export function useTypingIndicator(
  channel: Channel | null,
  currentUserId: string | undefined,
) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!channel) {
      setTypingUserIds([]);
      return;
    }

    const sync = () => {
      const ids = Object.keys(channel.state.typing ?? {}).filter(
        (id) => id !== currentUserId,
      );
      setTypingUserIds(ids);
    };

    sync();

    const startSub = channel.on("typing.start", sync);
    const stopSub = channel.on("typing.stop", sync);

    return () => {
      startSub.unsubscribe();
      stopSub.unsubscribe();
    };
  }, [channel, currentUserId]);

  const emitTyping = useCallback(() => {
    if (!channel) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    channel.keystroke().catch(() => {});

    debounceRef.current = setTimeout(() => {
      channel.stopTyping().catch(() => {});
    }, 3000);
  }, [channel]);

  const stopTyping = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    channel?.stopTyping().catch(() => {});
  }, [channel]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    isPeerTyping: typingUserIds.length > 0,
    emitTyping,
    stopTyping,
  };
}
