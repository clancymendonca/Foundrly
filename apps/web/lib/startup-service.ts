import slugify from "slugify";
import { writeClient } from "@/sanity/lib/write-client";
import { canUserPerformAction } from "@/lib/ban-checks";
import { syncStartupVector } from "@/lib/ai-vector-sync";
import { checkUserContentModeration } from "@/lib/content-moderation-guard";
import type { AppSession } from "@/lib/get-session";

export interface StartupInput {
  title: string;
  description: string;
  category: string;
  link?: string;
  pitch: string;
  buyMeACoffeeUsername?: string;
}

export async function createStartup(
  session: AppSession,
  input: StartupInput,
) {
  const banCheck = await canUserPerformAction(session.user.id);
  if (!banCheck.canPerform) {
    return { error: banCheck.message, status: "ERROR" as const };
  }

  const contentToModerate = [input.title, input.description, input.pitch]
    .filter(Boolean)
    .join("\n\n");

  const moderation = await checkUserContentModeration(contentToModerate, {
    userId: session.user.id,
    userName: session.user.name || "Unknown User",
    itemType: "startup",
  });

  if (!moderation.allowed) {
    return { error: moderation.message, status: "ERROR" as const };
  }

  const slug = slugify(input.title, { lower: true, strict: true });

  const result = await writeClient.create({
    _type: "startup",
    title: input.title,
    description: input.description,
    category: input.category,
    image: input.link,
    slug: { _type: slug, current: slug },
    author: { _type: "reference", _ref: session.user.id },
    pitch: input.pitch,
    buyMeACoffeeUsername: input.buyMeACoffeeUsername || undefined,
  });

  try {
    await syncStartupVector(result._id, "create");
  } catch (error) {
    console.error("Error syncing startup vector:", error);
  }

  return { data: result, status: "SUCCESS" as const };
}

export async function updateStartup(
  session: AppSession,
  startupId: string,
  input: StartupInput,
) {
  const banCheck = await canUserPerformAction(session.user.id);
  if (!banCheck.canPerform) {
    return { error: banCheck.message, status: "ERROR" as const };
  }

  const slug = slugify(input.title, { lower: true, strict: true });

  const result = await writeClient
    .patch(startupId)
    .set({
      title: input.title,
      description: input.description,
      category: input.category,
      image: input.link,
      slug: { _type: slug, current: slug },
      pitch: input.pitch,
      buyMeACoffeeUsername: input.buyMeACoffeeUsername || undefined,
    })
    .commit();

  return { data: result, status: "SUCCESS" as const };
}

export async function deleteStartup(session: AppSession, startupId: string) {
  const referencingDocs = await writeClient.fetch(
    `*[_type != "startup" && references($startupId)]{ _id }`,
    { startupId },
  );

  for (const doc of referencingDocs) {
    await writeClient
      .patch(doc._id)
      .unset(["category", "startup", "startups"])
      .commit();
  }

  await writeClient.delete(startupId);

  try {
    const { AIVectorSync } = await import("@/lib/ai-vector-sync");
    await AIVectorSync.deleteStartup(startupId);
  } catch (error) {
    console.error("Error deleting startup vector:", error);
  }

  return { status: "SUCCESS" as const };
}
