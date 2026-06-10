import type { Attachment, Channel } from "stream-chat";

export type PickedAttachment =
  | { kind: "image"; uri: string; name: string; mimeType: string }
  | { kind: "file"; uri: string; name: string; mimeType: string };

export function isImageAttachment(att: Attachment): boolean {
  if (
    att.type === "image" ||
    !!att.image_url ||
    !!att.thumb_url ||
    (att.mime_type?.startsWith("image/") ?? false)
  ) {
    return true;
  }

  const name = att.title || att.fallback || att.asset_url || "";
  return /\.(png|jpe?g|gif|webp|bmp|heic|heif)(\?|$)/i.test(name);
}

export function getAttachmentUrl(att: Attachment): string | undefined {
  return (
    att.image_url ||
    att.asset_url ||
    att.thumb_url ||
    att.og_scrape_url ||
    undefined
  );
}

export async function uploadAndSendAttachment(
  channel: Channel,
  picked: PickedAttachment,
  caption?: string,
): Promise<void> {
  let attachment: Attachment;

  if (picked.kind === "image") {
    const upload = await channel.sendImage(
      picked.uri,
      picked.name,
      picked.mimeType,
    );
    attachment = {
      type: "image",
      image_url: upload.file,
      thumb_url: upload.file,
      fallback: picked.name,
    };
  } else {
    const upload = await channel.sendFile(
      picked.uri,
      picked.name,
      picked.mimeType,
    );
    attachment = {
      type: "file",
      asset_url: upload.file,
      title: picked.name,
      mime_type: picked.mimeType,
    };
  }

  await channel.sendMessage({
    text: caption?.trim() || undefined,
    attachments: [attachment],
  });
}
