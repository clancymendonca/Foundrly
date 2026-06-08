import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { resolveClientProfileImageUrl } from "@/lib/sanity-image";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await client.fetch<{
      _id: string;
      name?: string;
      username?: string;
      image?: string;
    }>(
      `*[_type == "author" && _id == $id][0]{ _id, name, username, image }`,
      { id },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      username: user.username,
      image: resolveClientProfileImageUrl(user._id, user.image),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
