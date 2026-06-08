import { NextRequest, NextResponse } from "next/server";
import { exchangeGitHubCode, upsertAuthorFromGitHub } from "@/lib/github-auth";
import { signMobileToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "code and redirectUri are required" },
        { status: 400 },
      );
    }

    const profile = await exchangeGitHubCode(code, redirectUri);
    const author = await upsertAuthorFromGitHub(profile);

    if (!author?._id) {
      return NextResponse.json(
        { error: "Failed to resolve author" },
        { status: 500 },
      );
    }

    const user = {
      id: author._id as string,
      name: author.name ?? profile.name ?? null,
      email: author.email ?? profile.email ?? null,
      image: author.image ?? profile.avatar_url ?? null,
    };

    const token = await signMobileToken(user);

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("Mobile GitHub auth error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 401 },
    );
  }
}
