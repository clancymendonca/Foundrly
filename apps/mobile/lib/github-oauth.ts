import { makeRedirectUri } from "expo-auth-session";
import { API_URL, GITHUB_CLIENT_ID } from "./config";

/** Must match the Authorization callback URL in your GitHub OAuth app exactly. */
export const GITHUB_REDIRECT_URI = makeRedirectUri({
  native: "foundrly://github-callback",
});

export const githubDiscovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
};

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(GITHUB_CLIENT_ID);
}

export async function exchangeGitHubCode(
  code: string,
  codeVerifier: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/mobile/github/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirectUri: GITHUB_REDIRECT_URI,
      codeVerifier,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    error?: string;
  };

  if (!res.ok || !data.accessToken) {
    throw new Error(data.error || "GitHub token exchange failed");
  }

  return data.accessToken;
}
