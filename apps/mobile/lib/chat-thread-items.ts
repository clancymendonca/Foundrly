import { useMemo } from "react";
import type { LocalMessage } from "stream-chat";
import {
  formatMessageDateDivider,
  getMessageDayKey,
} from "@/lib/format-chat-time";

export type ChatThreadItem =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: LocalMessage; messageIndex: number };

export function buildChatThreadItems(
  messages: LocalMessage[],
): ChatThreadItem[] {
  const items: ChatThreadItem[] = [];
  let lastDayKey: string | null = null;

  messages.forEach((message, messageIndex) => {
    const dayKey = getMessageDayKey(
      message.created_at ? String(message.created_at) : undefined,
    );

    if (dayKey && dayKey !== lastDayKey) {
      items.push({
        type: "date",
        id: `date-${dayKey}`,
        label: formatMessageDateDivider(
          message.created_at ? String(message.created_at) : undefined,
        ),
      });
      lastDayKey = dayKey;
    }

    items.push({
      type: "message",
      id: `${message.id}-${messageIndex}`,
      message,
      messageIndex,
    });
  });

  return items;
}

export function useChatThreadItems(messages: LocalMessage[]) {
  return useMemo(() => buildChatThreadItems(messages), [messages]);
}
