import { useRouter } from "expo-router";
import type { StreamChat, Channel } from "stream-chat";

type AppRouter = ReturnType<typeof useRouter>;

export function normalizeRouteParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function openMessageThread(router: AppRouter, channelId: string) {
  router.push({
    pathname: "/messages/[channelId]",
    params: { channelId },
  } as never);
}

export function replaceMessageThread(router: AppRouter, channelId: string) {
  router.replace({
    pathname: "/messages/[channelId]",
    params: { channelId },
  } as never);
}

export function openNewMessage(router: AppRouter) {
  router.push("/messages/new" as never);
}

/** Prefer queryChannels so we never trigger client-side channel creation (error 17). */
export async function watchMessagingChannel(
  client: StreamChat,
  userId: string,
  channelId: string,
): Promise<Channel> {
  const membershipFilter = {
    type: "messaging" as const,
    members: { $in: [userId] },
  };

  const byId = await client.queryChannels(
    { ...membershipFilter, id: channelId },
    { last_message_at: -1 },
    { limit: 1, watch: true, state: true },
  );
  if (byId[0]) return byId[0];

  const byCid = await client.queryChannels(
    { ...membershipFilter, cid: `messaging:${channelId}` },
    { last_message_at: -1 },
    { limit: 1, watch: true, state: true },
  );
  if (byCid[0]) return byCid[0];

  const channel = client.channel("messaging", channelId);
  const state = await channel.watch();
  if (!state) {
    throw new Error("Channel not found");
  }
  return channel;
}
