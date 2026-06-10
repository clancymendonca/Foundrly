import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { userId, deviceToken, provider = "firebase" } = await req.json();

    if (!userId || !deviceToken) {
      return NextResponse.json(
        { error: "userId and deviceToken are required" },
        { status: 400 },
      );
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    await serverClient.addDevice(deviceToken, provider, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to register chat device:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 },
    );
  }
}
