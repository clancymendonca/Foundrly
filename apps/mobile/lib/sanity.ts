import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import {
  API_URL,
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from "./config";

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: string) {
  if (!source) return "";
  if (source.startsWith("http")) return source;
  if (source.startsWith("/uploads/")) return `${API_URL}${source}`;
  try {
    return builder.image(source).width(800).url();
  } catch {
    return "";
  }
}
