import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { resolveDisplayImageUrl } from "@/lib/sanity-image";

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await client.fetch<{ image?: string }>(
      `*[_type == "author" && _id == $id][0]{ image }`,
      { id },
    );

    if (!user?.image) {
      return new NextResponse(null, { status: 404 });
    }

    if (user.image.startsWith("data:")) {
      const parsed = parseDataUrl(user.image);
      if (!parsed) {
        return new NextResponse(null, { status: 400 });
      }

      return new NextResponse(parsed.buffer, {
        headers: {
          "Content-Type": parsed.contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const url = resolveDisplayImageUrl(user.image);
    if (!url) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error serving user avatar:", error);
    return new NextResponse(null, { status: 500 });
  }
}
