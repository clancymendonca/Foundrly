const MAX_STREAM_IMAGE_URL_LENGTH = 2048;

/** Stream rejects oversized payloads (error code 22). Strip data URLs and long values. */
export function sanitizeStreamUserImage(
  image?: string | null,
): string | undefined {
  if (!image || typeof image !== "string") return undefined;

  const trimmed = image.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return undefined;
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://")
  ) {
    return undefined;
  }
  if (trimmed.length > MAX_STREAM_IMAGE_URL_LENGTH) return undefined;

  return trimmed;
}

export function sanitizeStreamUser(user: {
  id: string;
  name?: string | null;
  image?: string | null;
}) {
  return {
    id: user.id,
    name: user.name?.trim() || undefined,
    image: sanitizeStreamUserImage(user.image),
  };
}
