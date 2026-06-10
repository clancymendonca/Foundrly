import { useEffect, useState } from "react";
import type { Channel } from "stream-chat";

export function usePeerPresence(
  channel: Channel | null,
  otherUserId: string | null,
) {
  const [online, setOnline] = useState(false);
  const [lastActive, setLastActive] = useState<string | null>(null);

  useEffect(() => {
    if (!channel || !otherUserId) {
      setOnline(false);
      setLastActive(null);
      return;
    }

    const sync = () => {
      const member = channel.state.members?.[otherUserId];
      const user = member?.user;
      setOnline(!!user?.online);
      setLastActive(user?.last_active ? String(user.last_active) : null);
    };

    sync();

    const sub = channel.on("user.presence.changed", (event) => {
      if (event.user?.id === otherUserId) {
        setOnline(!!event.user.online);
        setLastActive(
          event.user.last_active ? String(event.user.last_active) : null,
        );
      }
    });

    return () => sub.unsubscribe();
  }, [channel, otherUserId]);

  return { online, lastActive };
}
