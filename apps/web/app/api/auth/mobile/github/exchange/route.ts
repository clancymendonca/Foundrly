import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri, codeVerifier } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (!redirectUri || typeof redirectUri !== "string") {
      return NextResponse.json(
        { error: "redirectUri is required" },
        { status: 400 },
      );
    }
    if (!codeVerifier || typeof codeVerifier !== "string") {
      return NextResponse.json(
        { error: "codeVerifier is required" },
        { status: 400 },
      );
    }

    const clientId =
      process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "";
    const clientSecret =
      process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "GitHub OAuth is not configured on the server" },
        { status: 500 },
      );
    }

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      },
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        {
          error:
            tokenData.error_description ||
            tokenData.error ||
            "GitHub token exchange failed",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({ accessToken: tokenData.access_token });
  } catch (error) {
    console.error("GitHub mobile exchange error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "GitHub exchange failed",
      },
      { status: 500 },
    );
  }
}
