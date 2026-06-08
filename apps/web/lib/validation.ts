import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(20).max(500),
  category: z.string().min(3).max(20),
  link: z
    .string()
    .url()
    .refine(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        const contentType = res.headers.get("content-type");

        return contentType?.startsWith("image/");
      } catch {
        return false;
      }
    })
    .optional()
    .or(z.literal("")),
  pitch: z.string().min(10),
  imageFile: z.any().optional(), // For uploaded files
  buyMeACoffeeUsername: z.string().optional(),
}).refine((data) => {
  // Either link or imageFile must be provided
  return data.link || data.imageFile;
}, {
  message: "Either an image URL or uploaded image is required",
  path: ["link"],
}); 