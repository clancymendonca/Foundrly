import type { SessionUser } from "@foundrly/shared";
import { API_URL } from "./config";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || res.statusText, res.status);
  }

  return data as T;
}

export async function mobileGithubAuth(
  code: string,
  redirectUri: string,
): Promise<{ token: string; user: SessionUser }> {
  return apiFetch("/api/auth/mobile/github", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri }),
  });
}
