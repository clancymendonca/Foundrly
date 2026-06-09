import type { StreamChat } from "stream-chat";
import { createHash } from "crypto";

export type DmChannelData = {
  name?: string;
  image?: string;
};

/** Legacy ID format used by earlier versions of this app. */
export function buildLegacyDmChannelId(memberIds: string[]): string {
  return `messaging-${[...memberIds].sort().join("-")}`;
}

/** Short deterministic ID when legacy format exceeds Stream's 64-char limit. */
export function buildHashedDmChannelId(memberIds: string[]): string {
  const hash = createHash("sha256")
    .update([...memberIds].sort().join(":"))
    .digest("hex")
    .slice(0, 40);
  return `dm-${hash}`;
}

export function resolveDmChannelId(memberIds: string[]): string {
  const legacy = buildLegacyDmChannelId(memberIds);
  return legacy.length <= 64 ? legacy : buildHashedDmChannelId(memberIds);
}

export async function findExistingDmChannel(
  serverClient: StreamChat,
  memberIds: string[],
) {
  const sorted = [...new Set(memberIds)].sort();
  if (sorted.length < 2) return null;

  const channels = await serverClient.queryChannels(
    {
      type: "messaging",
      members: { $eq: sorted },
    },
    [{ last_message_at: -1 }],
    { limit: 1 },
  );

  if (channels[0]?.id) {
    return channels[0];
  }

  const legacyId = buildLegacyDmChannelId(sorted);
  if (legacyId.length <= 64) {
    try {
      const legacyChannel = serverClient.channel("messaging", legacyId);
      await legacyChannel.query();
      return legacyChannel;
    } catch {
      // not found
    }
  }

  const hashedId = buildHashedDmChannelId(sorted);
  try {
    const hashedChannel = serverClient.channel("messaging", hashedId);
    await hashedChannel.query();
    return hashedChannel;
  } catch {
    return null;
  }
}

export async function getOrCreateDmChannel(
  serverClient: StreamChat,
  userId: string,
  memberIds: string[],
  channelData?: DmChannelData,
): Promise<string> {
  const uniqueMembers = [...new Set(memberIds)];
  if (uniqueMembers.length < 2) {
    throw new Error("At least 2 members are required to create a channel");
  }

  const existing = await findExistingDmChannel(serverClient, uniqueMembers);
  if (existing?.id) {
    return existing.id;
  }

  const channelId = resolveDmChannelId(uniqueMembers);
  const channel = serverClient.channel("messaging", channelId, {
    members: uniqueMembers,
    created_by: { id: userId },
    ...channelData,
  });

  try {
    await channel.create();
    return channel.id!;
  } catch (error) {
    const retry = await findExistingDmChannel(serverClient, uniqueMembers);
    if (retry?.id) {
      return retry.id;
    }

    // Distinct channel fallback (Stream-generated ID, always valid length)
    const distinctChannel = serverClient.channel("messaging", {
      members: uniqueMembers,
      created_by: { id: userId },
      ...channelData,
    });
    await distinctChannel.create();
    return distinctChannel.id!;
  }
}
