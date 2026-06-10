import { File, UploadType } from "expo-file-system";
import { getAuthToken } from "./api-client";
import { API_URL } from "./config";

const MAX_BYTES = 5 * 1024 * 1024;

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UploadApiResponse {
  success?: boolean;
  url?: string;
  error?: string;
}

function parseUploadResponse(body: string): UploadApiResponse {
  try {
    return JSON.parse(body) as UploadApiResponse;
  } catch {
    return {};
  }
}

function resolveUploadUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_URL.replace(/\/$/, "")}${url}`;
  }
  return url;
}

export async function uploadImage(
  uri: string,
  mimeType = "image/jpeg",
  _fileName = "startup-image.jpg",
): Promise<UploadImageResult> {
  try {
    const file = new File(uri);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await file.upload(`${API_URL}/api/upload`, {
      httpMethod: "POST",
      uploadType: UploadType.MULTIPART,
      fieldName: "file",
      mimeType,
      headers,
    });

    const data = parseUploadResponse(result.body);

    if (result.status < 200 || result.status >= 300) {
      return {
        success: false,
        error: data.error || `Upload failed (${result.status})`,
      };
    }

    if (!data.success || !data.url) {
      return {
        success: false,
        error: data.error || "Failed to upload image",
      };
    }

    return { success: true, url: resolveUploadUrl(data.url) };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to upload image",
    };
  }
}

export { MAX_BYTES as MAX_UPLOAD_BYTES };
