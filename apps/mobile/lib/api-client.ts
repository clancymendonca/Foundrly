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
    const msg =
      data.details ||
      data.error ||
      (typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: string }).message)
        : res.statusText);
    throw new ApiError(
      msg.includes("FIREBASE") || msg.includes("firebase")
        ? "Server Firebase admin is not configured. Add FIREBASE_* to apps/web/.env.local."
        : msg,
      res.status,
    );
  }

  return data as T;
}

export async function mobileFirebaseAuth(
  idToken: string,
): Promise<{ token: string; user: SessionUser }> {
  return apiFetch("/api/auth/mobile/firebase", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data.error ||
      (typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: string }).message)
        : res.statusText);
    throw new ApiError(msg, res.status);
  }

  return data as T;
}
