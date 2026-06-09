import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";

const builder = imageUrlBuilder(client);

/** Prefer a stable URL for clients; data URLs are served via /api/user/[id]/avatar. */
export function resolveClientProfileImageUrl(
  userId: string,
  source?: string | null,
): string | undefined {
  if (!source || typeof source !== "string") return undefined;

  const trimmed = source.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return `/api/user/${userId}/avatar`;

  return resolveDisplayImageUrl(trimmed);
}

/** Resolve profile images for UI display (includes data URLs). */
export function resolveDisplayImageUrl(
  source?: string | null,
): string | undefined {
  if (!source || typeof source !== "string") return undefined;

  const trimmed = source.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return trimmed;

  return resolveSanityImageUrl(trimmed);
}

export function resolveSanityImageUrl(source?: string | null): string | undefined {
  if (!source || typeof source !== "string") return undefined;

  const trimmed = source.trim();
  if (!trimmed || trimmed.startsWith("data:")) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${trimmed}`;
  }

  try {
    return builder.image(trimmed).width(200).height(200).url();
  } catch {
    return undefined;
  }
}
