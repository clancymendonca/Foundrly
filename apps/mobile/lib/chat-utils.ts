import type { Channel, LocalMessage, UserResponse } from "stream-chat";
import type { Message } from "@foundrly/shared";
import { sanitizeStreamUserImage } from "@foundrly/shared";
import { apiFetch } from "./api-client";
import { API_URL } from "./config";
import { formatChatTime } from "./format-chat-time";
import { urlForImage } from "./sanity";
import { isImageAttachment } from "./chat-attachments";

export interface SuggestedContact {
  _id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  type?: "follower" | "mutual" | "other";
}

/** Resolve profile images for UI display (includes data URLs). */
export function resolveDisplayImageUrl(
  image?: string | null,
): string | undefined {
  if (!image || typeof image !== "string") return undefined;

  const trimmed = image.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/")) return `${API_URL}${trimmed}`;

  const resolved = urlForImage(trimmed);
  return resolved || undefined;
}

/** Resolve images safe for Stream Chat (http/https only). */
export function resolveChatImageUrl(
  image?: string | null,
): string | undefined {
  return sanitizeStreamUserImage(resolveDisplayImageUrl(image));
}

export type ChatProfile = {
  id: string;
  name?: string;
  imageUrl?: string;
};

export async function fetchChatProfile(
  userId: string,
): Promise<ChatProfile | null> {
  try {
    const profile = await apiFetch<{
      id: string;
      name?: string;
      image?: string;
    }>(`/api/user/${userId}/profile`);

    return {
      id: profile.id,
      name: profile.name,
      imageUrl: resolveDisplayImageUrl(profile.image),
    };
  } catch {
    return null;
  }
}

export function getPeerIdFromLegacyChannelId(
  channelId: string | undefined,
  userId: string,
): string | null {
  if (!channelId?.startsWith("messaging-")) return null;

  for (const id of channelId.slice("messaging-".length).split("-")) {
    if (id && id !== userId) return id;
  }

  return null;
}

export function getChannelMessages(channel: Channel): LocalMessage[] {
  return channel.state.messages ?? [];
}

export function getMessageUserId(msg: LocalMessage): string | undefined {
  return msg.user_id ?? msg.user?.id;
}

/** True only when Stream recorded a real text edit. */
export function isMessageEdited(msg: LocalMessage): boolean {
  if (!msg.message_text_updated_at || !msg.created_at) return false;

  const updated = new Date(msg.message_text_updated_at).getTime();
  const created = new Date(String(msg.created_at)).getTime();
  if (Number.isNaN(updated) || Number.isNaN(created)) return false;

  // Stream may set message_text_updated_at equal to created_at on send.
  return updated - created > 1000;
}

export function getChannelOtherUser(
  channel: Channel,
  userId: string,
  messages: LocalMessage[] = [],
): UserResponse | null {
  const members = Object.values(channel.state.members ?? {});
  const otherMember = members.find(
    (m) => (m.user?.id ?? m.user_id) !== userId,
  );
  if (otherMember?.user) {
    return otherMember.user;
  }
  if (otherMember?.user_id && otherMember.user_id !== userId) {
    return { id: otherMember.user_id } as UserResponse;
  }

  const channelMessages =
    messages.length > 0 ? messages : getChannelMessages(channel);
  const otherMessage = channelMessages.find((m) => {
    const messageUserId = getMessageUserId(m);
    return messageUserId && messageUserId !== userId;
  });
  if (otherMessage?.user) {
    return otherMessage.user;
  }

  const messageUserId = otherMessage ? getMessageUserId(otherMessage) : undefined;
  if (messageUserId) {
    return { id: messageUserId } as UserResponse;
  }

  const peerFromChannelId = getPeerIdFromLegacyChannelId(channel.id, userId);
  if (peerFromChannelId) {
    return { id: peerFromChannelId } as UserResponse;
  }

  return null;
}

export function getOtherMemberId(channel: Channel, userId: string): string | null {
  const other = getChannelOtherUser(
    channel,
    userId,
    getChannelMessages(channel),
  );
  return other?.id ?? null;
}

type PeerReadState = {
  last_read?: Date | string;
  last_read_message_id?: string;
  unread_messages?: number;
};

/** Peer read cursor in a 1:1 channel (not the current user's own read state). */
export function getPeerReadState(
  channel: Channel,
  userId: string,
): PeerReadState | null {
  const readMap = channel.state.read ?? {};
  const otherId = getOtherMemberId(channel, userId);

  if (otherId && readMap[otherId]) {
    return readMap[otherId];
  }

  for (const [id, state] of Object.entries(readMap)) {
    if (id !== userId) return state;
  }

  return null;
}

export function isMessageSeenByPeer(
  channel: Channel,
  msg: LocalMessage,
  messages: LocalMessage[],
  userId: string,
): boolean {
  const readState = getPeerReadState(channel, userId);
  const msgIndex = messages.findIndex((m) => m.id === msg.id);
  if (msgIndex < 0) return false;

  if (readState?.last_read_message_id) {
    const readIndex = messages.findIndex(
      (m) => m.id === readState.last_read_message_id,
    );
    if (readIndex >= 0 && msgIndex <= readIndex) {
      return true;
    }
  }

  if (readState?.last_read) {
    const lastReadTime = new Date(String(readState.last_read)).getTime();
    const msgTime = new Date(String(msg.created_at)).getTime();
    if (
      !Number.isNaN(lastReadTime) &&
      !Number.isNaN(msgTime) &&
      lastReadTime >= msgTime
    ) {
      return true;
    }
  }

  // If the peer replied after this outgoing streak, they read it.
  for (let i = msgIndex + 1; i < messages.length; i++) {
    const authorId = getMessageUserId(messages[i]);
    if (authorId === userId) return false;
    if (authorId && authorId !== userId) return true;
  }

  return false;
}

export function dedupeChannelsByMember(
  channels: Channel[],
  userId: string,
): Channel[] {
  const byOther = new Map<string, Channel>();

  for (const channel of channels) {
    const otherId = getOtherMemberId(channel, userId);
    if (!otherId) continue;

    const existing = byOther.get(otherId);
    if (!existing) {
      byOther.set(otherId, channel);
      continue;
    }

    const existingTime = existing.state.last_message_at
      ? new Date(String(existing.state.last_message_at)).getTime()
      : 0;
    const channelTime = channel.state.last_message_at
      ? new Date(String(channel.state.last_message_at)).getTime()
      : 0;

    if (channelTime >= existingTime) {
      byOther.set(otherId, channel);
    }
  }

  return [...byOther.values()].sort((a, b) => {
    const aTime = a.state.last_message_at
      ? new Date(String(a.state.last_message_at)).getTime()
      : 0;
    const bTime = b.state.last_message_at
      ? new Date(String(b.state.last_message_at)).getTime()
      : 0;
    return bTime - aTime;
  });
}

export function getMessagePreview(msg: LocalMessage): string {
  if (msg.deleted_at || msg.type === "deleted") return "Message deleted";

  if (msg.parent_id) {
    const text = msg.text?.trim();
    return text ? `Replied: ${text}` : "Replied to a message";
  }

  if (msg.attachments?.length) {
    const first = msg.attachments[0];
    if (isImageAttachment(first)) return "Photo";
    if (first.type === "file") return first.title || "File";
    return "Attachment";
  }

  return msg.text?.trim() || "No messages yet.";
}

export function mapChannelToMessage(
  channel: Channel,
  userId: string,
  profileCache?: Map<string, ChatProfile>,
): Message {
  const other = getChannelOtherUser(channel, userId, channel.state.messages);
  const otherId = getOtherMemberId(channel, userId);
  const cachedProfile = otherId ? profileCache?.get(otherId) : undefined;
  const lastMessage =
    channel.state.messages.length > 0
      ? channel.state.messages[channel.state.messages.length - 1]
      : null;
  const unreadCount = channel.countUnread() || undefined;

  return {
    id: channel.id || "",
    name: cachedProfile?.name ?? other?.name ?? other?.id ?? "Unknown",
    message: lastMessage ? getMessagePreview(lastMessage) : "No messages yet.",
    time: lastMessage
      ? formatChatTime(String(lastMessage.created_at))
      : "",
    avatarUrl: resolveDisplayImageUrl(
      cachedProfile?.imageUrl ?? other?.image,
    ),
    avatarInitial: other?.name?.[0] || other?.id?.[0],
    unreadCount,
    lastMessageAt: lastMessage?.created_at
      ? String(lastMessage.created_at)
      : undefined,
  };
}

export async function channelsToMessages(
  channels: Channel[],
  userId: string,
): Promise<Message[]> {
  const deduped = dedupeChannelsByMember(channels, userId);
  const peerIds = [
    ...new Set(
      deduped
        .map((ch) => getOtherMemberId(ch, userId))
        .filter((id): id is string => !!id),
    ),
  ];

  const profileEntries = await Promise.all(
    peerIds.map(async (id) => {
      const profile = await fetchChatProfile(id);
      return profile ? ([id, profile] as const) : null;
    }),
  );
  const profileCache = new Map(
    profileEntries.filter(Boolean).map((entry) => entry!),
  );

  return deduped.map((ch) => mapChannelToMessage(ch, userId, profileCache));
}

export async function upsertAndCreateChannel(
  userId: string,
  contact: SuggestedContact,
): Promise<string> {

  await apiFetch("/api/chat/upsert-user", {
    method: "POST",
    body: JSON.stringify({
      id: contact._id,
      name: contact.name,
      image: resolveChatImageUrl(contact.image),
    }),
  });

  const { channelId } = await apiFetch<{ channelId: string }>(
    "/api/chat/create-channel",
    {
      method: "POST",
      body: JSON.stringify({
        userId,
        memberIds: [userId, contact._id],
        channelData: {
          name: `Chat with ${contact.name}`,
          image: resolveChatImageUrl(contact.image),
        },
      }),
    },
  );

  const ensured = await apiFetch<{ channelId: string }>(
    "/api/chat/ensure-channel-access",
    {
      method: "POST",
      body: JSON.stringify({
        channelId,
        memberIds: [userId, contact._id],
      }),
    },
  );

  return ensured.channelId;
}
