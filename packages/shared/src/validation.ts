import { z } from "zod";

function isValidImageLink(value: string): boolean {
  if (!value.trim()) return true;
  if (value.startsWith("/")) return true;
  return z.string().url().safeParse(value).success;
}

const startupFormFields = {
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500),
  category: z
    .string()
    .min(3, "Category must be at least 3 characters")
    .max(20),
  link: z
    .string()
    .refine(isValidImageLink, {
      message: "Please enter a valid image URL",
    }),
  pitch: z.string().min(10, "Pitch must be at least 10 characters"),
  buyMeACoffeeUsername: z.string().optional(),
};
export const startupFormSchema = z
  .object(startupFormFields)
  .refine((data) => Boolean(data.link?.trim()), {
    message: "An image URL or uploaded image is required",
    path: ["link"],
  });

/** Mobile/web form schema — image via URL or gallery upload flag. */
export const startupFormSchemaWithImage = z
  .object({
    ...startupFormFields,
    hasUploadedImage: z.boolean().optional(),
  })
  .refine(
    (data) => Boolean(data.link?.trim()) || data.hasUploadedImage === true,
    {
      message: "An image URL or uploaded image is required",
      path: ["link"],
    },
  );

export type StartupFormValues = z.infer<typeof startupFormSchemaWithImage>;
