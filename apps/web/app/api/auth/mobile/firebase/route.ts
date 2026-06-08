import { NextRequest, NextResponse } from "next/server";
import {
  upsertAuthorFromFirebase,
  verifyFirebaseIdToken,
} from "@/lib/firebase-auth";
import { signMobileToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 },
      );
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const author = await upsertAuthorFromFirebase(decoded);

    const user = {
      id: author._id,
      name: author.name ?? decoded.name ?? null,
      email: author.email ?? decoded.email ?? null,
      image: author.image ?? decoded.picture ?? null,
    };

    const token = await signMobileToken(user);

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("Mobile Firebase auth error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 401 },
    );
  }
}
