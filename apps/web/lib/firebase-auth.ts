import type { DecodedIdToken } from "firebase-admin/auth";
import { client } from "@/sanity/lib/client";
import {
  AUTHOR_BY_EMAIL_QUERY,
  AUTHOR_BY_FIREBASE_UID_QUERY,
} from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/write-client";
import { getFirebaseAdminAuth } from "./firebase-admin";

export type FirebaseAuthor = {
  _id: string;
  id?: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
};

export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<DecodedIdToken> {
  return getFirebaseAdminAuth().verifyIdToken(idToken);
}

function deriveUsername(decoded: DecodedIdToken): string {
  const email = decoded.email;
  if (email) {
    const local = email.split("@")[0] ?? "user";
    return local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
  }
  const base = (decoded.name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 24);
  return `${base}_${decoded.uid.slice(0, 6)}`;
}

async function upsertStreamChatUser(author: FirebaseAuthor) {
  try {
    await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/chat/upsert-user`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: author._id,
          name: author.name,
          image: author.image,
        }),
      },
    );
  } catch (e) {
    console.error("Stream Chat upsert-user error", e);
  }
}

export async function upsertAuthorFromFirebase(
  decoded: DecodedIdToken,
): Promise<FirebaseAuthor> {
  const firebaseUid = decoded.uid;
  const email = decoded.email ?? null;
  const name = decoded.name ?? email?.split("@")[0] ?? "User";
  const image = decoded.picture ?? null;

  let existing = await client
    .withConfig({ useCdn: false })
    .fetch<FirebaseAuthor | null>(AUTHOR_BY_FIREBASE_UID_QUERY, {
      id: firebaseUid,
    });

  if (!existing && email) {
    const byEmail = await client
      .withConfig({ useCdn: false })
      .fetch<FirebaseAuthor | null>(AUTHOR_BY_EMAIL_QUERY, { email });

    if (byEmail?._id) {
      await writeClient.patch(byEmail._id).set({ id: firebaseUid }).commit();
      existing = { ...byEmail, id: firebaseUid };
    }
  }

  if (!existing) {
    await writeClient.create({
      _type: "author",
      id: firebaseUid,
      name,
      username: deriveUsername(decoded),
      email: email || `${firebaseUid}@firebase.local`,
      image,
      bio: "",
      followers: [],
      following: [],
    });
  } else if (image && !existing.image) {
    await writeClient.patch(existing._id).set({ image }).commit();
  }

  const author = await client
    .withConfig({ useCdn: false })
    .fetch<FirebaseAuthor>(AUTHOR_BY_FIREBASE_UID_QUERY, { id: firebaseUid });

  if (!author?._id) {
    throw new Error("Failed to resolve author after Firebase upsert");
  }

  await upsertStreamChatUser(author);
  return author;
}
