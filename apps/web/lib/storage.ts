import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface StorageResult {
  success: boolean;
  url: string;
  filename: string;
  error?: string;
}

export const uploadToStorage = async (file: File): Promise<StorageResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    const useVercelBlob = isProduction || Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    if (useVercelBlob) {
      // Use Vercel Blob in production
      const blob = await put(filename, file, {
        access: 'public',
      });

      return {
        success: true,
        url: blob.url,
        filename: filename,
      };
    } else {
      // Use local storage in development
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const filepath = join(uploadsDir, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      const publicUrl = `/uploads/${filename}`;

      return {
        success: true,
        url: publicUrl,
        filename: filename,
      };
    }
  } catch (error) {
    console.error("Storage upload error:", error);
    return {
      success: false,
      url: "",
      filename: "",
      error: "Failed to upload file",
    };
  }
}; 