import { useMemo } from "react";
import type { Attachment, LocalMessage } from "stream-chat";
import {
  getAttachmentUrl,
  isImageAttachment,
} from "@/lib/chat-attachments";

export type ConversationMediaItem = {
  id: string;
  messageId: string;
  attachment: Attachment;
  url?: string;
  title?: string;
  createdAt?: string;
};

export function useConversationMedia(messages: LocalMessage[]) {
  return useMemo(() => {
    const photos: ConversationMediaItem[] = [];
    const files: ConversationMediaItem[] = [];

    for (const message of messages) {
      if (message.deleted_at || !message.attachments?.length) continue;

      message.attachments.forEach((attachment, index) => {
        const item: ConversationMediaItem = {
          id: `${message.id}-${index}`,
          messageId: message.id,
          attachment,
          url: getAttachmentUrl(attachment),
          title: attachment.title || attachment.fallback,
          createdAt: message.created_at
            ? String(message.created_at)
            : undefined,
        };

        if (isImageAttachment(attachment)) {
          photos.push(item);
        } else {
          files.push(item);
        }
      });
    }

    return { photos, files };
  }, [messages]);
}
