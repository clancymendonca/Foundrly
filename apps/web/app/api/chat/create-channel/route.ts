import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import { sanitizeStreamUser } from "@foundrly/shared";
import { client } from "@/sanity/lib/client";
import { isCurrentlyBanned } from "@/sanity/lib/moderation";
import { getOrCreateDmChannel } from "@/lib/chat-channels";
import { resolveSanityImageUrl } from "@/lib/sanity-image";

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream Chat is not configured on the server" },
        { status: 500 },
      );
    }

    const { userId, memberIds, channelData } = await req.json();

    if (!userId || !memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return NextResponse.json(
        {
          error:
            "Invalid request: userId and memberIds array with at least 2 members required",
        },
        { status: 400 },
      );
    }

    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned }`,
      { userId },
    );

    if (user?.isBanned) {
      const isCurrentlyBannedUser = isCurrentlyBanned(
        user.bannedUntil,
        user.isBanned,
      );
      if (isCurrentlyBannedUser) {
        return NextResponse.json(
          {
            error: "Account is suspended. You cannot send messages.",
            details:
              "Your account has been suspended due to a violation of our community guidelines.",
          },
          { status: 403 },
        );
      }
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret, {
      timeout: 10000,
    });

    const uniqueMemberIds = [...new Set(memberIds as string[])];

    try {
      const membersFromSanity = await client.fetch(
        `*[_type == "author" && _id in $ids]{ _id, name, image }`,
        { ids: uniqueMemberIds },
      );
      const idToProfile = Object.fromEntries(
        (membersFromSanity || []).map((u: { _id: string; name?: string; image?: string }) => [
          u._id,
          u,
        ]),
      );
      await serverClient.upsertUsers(
        uniqueMemberIds.map((id: string) =>
          sanitizeStreamUser({
            id,
            name: idToProfile[id]?.name,
            image: resolveSanityImageUrl(idToProfile[id]?.image),
          }),
        ),
      );
    } catch (e) {
      console.error("Failed to upsert Stream users for channel creation", e);
    }

    const channelId = await getOrCreateDmChannel(
      serverClient,
      userId,
      uniqueMemberIds,
      channelData,
    );

    return NextResponse.json({
      channelId,
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error creating channel";
    console.error("Error creating chat channel:", error);
    return NextResponse.json(
      {
        error: "Failed to create chat channel",
        details: message,
      },
      { status: 500 },
    );
  }
}
