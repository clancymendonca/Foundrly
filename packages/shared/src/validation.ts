import { z } from "zod";

export const startupFormSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().min(20).max(500),
    category: z.string().min(3).max(20),
    link: z.string().url().optional().or(z.literal("")),
    pitch: z.string().min(10),
    buyMeACoffeeUsername: z.string().optional(),
  })
  .refine((data) => data.link || data.title, {
    message: "An image URL or uploaded image is required",
    path: ["link"],
  });

export type StartupFormValues = z.infer<typeof startupFormSchema>;
