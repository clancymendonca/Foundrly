import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import { getSession } from "@/lib/get-session";
import {
  getOrCreateDmChannel,
} from "@/lib/chat-channels";

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

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { channelId, memberIds } = await req.json();
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    if (Array.isArray(memberIds) && memberIds.length >= 2) {
      const uniqueMembers = [...new Set([userId, ...memberIds])];
      const channelIdFromMembers = await getOrCreateDmChannel(
        serverClient,
        userId,
        uniqueMembers,
      );
      return NextResponse.json({ channelId: channelIdFromMembers });
    }

    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        { error: "channelId or memberIds required" },
        { status: 400 },
      );
    }

    const channel = serverClient.channel("messaging", channelId);
    await channel.query();

    const members = Object.keys(channel.state?.members ?? {});
    if (!members.includes(userId)) {
      await channel.addMembers([userId]);
    }

    return NextResponse.json({ channelId: channel.id ?? channelId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to ensure channel access";
    console.error("ensure-channel-access error:", error);
    return NextResponse.json(
      { error: "Failed to ensure channel access", details: message },
      { status: 500 },
    );
  }
}
