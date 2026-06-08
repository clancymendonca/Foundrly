export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Upload failed",
      };
    }

    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Network error occurred",
    };
  }
}; 