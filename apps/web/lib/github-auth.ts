import { client } from "@/sanity/lib/client";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/write-client";

export interface GitHubProfile {
  id: string;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export async function upsertAuthorFromGitHub(profile: GitHubProfile) {
  const existingUser = await client
    .withConfig({ useCdn: false })
    .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: profile.id });

  if (!existingUser) {
    await writeClient.create({
      _type: "author",
      id: profile.id,
      name: profile.name,
      username: profile.login,
      email: profile.email,
      image: profile.avatar_url,
      bio: profile.bio || "",
      followers: [],
      following: [],
    });
  }

  const user = await client
    .withConfig({ useCdn: false })
    .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: profile.id });

  try {
    await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/chat/upsert-user`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          name: profile.name,
          image: profile.avatar_url,
        }),
      },
    );
  } catch (e) {
    console.error("Stream Chat upsert-user error", e);
  }

  return user;
}

export async function exchangeGitHubCode(
  code: string,
  redirectUri: string,
): Promise<GitHubProfile> {
  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured");
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error || !tokenData.access_token) {
    throw new Error(tokenData.error_description || "Failed to exchange GitHub code");
  }

  const profileRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!profileRes.ok) {
    throw new Error("Failed to fetch GitHub profile");
  }

  const profile = await profileRes.json();
  return {
    id: String(profile.id),
    login: profile.login,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
  };
}
