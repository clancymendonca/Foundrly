import { resolveSanityImageUrl } from "@/lib/sanity-image";
import { sanitizeStreamUser } from "@foundrly/shared";
import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import { client } from "@/sanity/lib/client";
import { isCurrentlyBanned } from "@/sanity/lib/moderation";

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

    const { id, name: reqName, image: reqImage } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const user = await client.fetch(
      `*[_type == "author" && _id == $id][0]{ _id, bannedUntil, isBanned, name, image }`,
      { id },
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

    let name = reqName;
    let image = reqImage;

    if (user) {
      name = user.name || name;
      image = resolveSanityImageUrl(user.image) || image;
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    await serverClient.upsertUser(
      sanitizeStreamUser({
        id,
        name,
        image: resolveSanityImageUrl(image),
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upsert Stream user";
    console.error("Error upserting Stream user:", error);
    return NextResponse.json(
      { error: "Failed to upsert Stream user", details: message },
      { status: 500 },
    );
  }
}
