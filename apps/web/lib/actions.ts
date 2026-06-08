"use server";

import { getSession } from "@/lib/get-session";
import { parseServerActionResponse } from "@/lib/utils";
import slugify from "slugify";
import { writeClient } from "@/sanity/lib/write-client";
import { canUserPerformAction } from "@/lib/ban-checks";
import { syncStartupVector } from "@/lib/ai-vector-sync";
import { checkUserContentModeration } from "@/lib/content-moderation-guard";

export const createPitch = async (
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await getSession();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  // Check if user is banned
  const banCheck = await canUserPerformAction(session.user.id);
  if (!banCheck.canPerform) {
    return parseServerActionResponse({
      error: banCheck.message,
      status: "ERROR",
    });
  }

  const { title, description, category, link, buyMeACoffeeUsername } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch"),
  );

  const slug = slugify(title as string, { lower: true, strict: true });

  const contentToModerate = [title, description, pitch].filter(Boolean).join('\n\n');
  const moderation = await checkUserContentModeration(contentToModerate, {
    userId: session.user.id,
    userName: session.user.name || session.user.username || 'Unknown User',
    itemType: 'startup',
  });
  if (!moderation.allowed) {
    return parseServerActionResponse({
      error: moderation.message,
      status: "ERROR",
    });
  }

  try {
    const startup = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: slug,
        current: slug,
      },
      author: {
        _type: "reference",
        _ref: session?.user?.id,
      },
      pitch,
      buyMeACoffeeUsername: buyMeACoffeeUsername || undefined,
    };

    const result = await writeClient.create({ _type: "startup", ...startup });

    // Sync with AI vector database in the background
    try {
      await syncStartupVector(result._id, 'create');
    } catch (error) {
      console.error('Error syncing startup vector:', error);
      // Don't fail the startup creation if vector sync fails
    }

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updatePitch = async (
  state: any,
  form: FormData,
  pitch: string,
  startupId: string,
) => {
  const session = await getSession();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  // Check if user is banned
  const banCheck = await canUserPerformAction(session.user.id);
  if (!banCheck.canPerform) {
    return parseServerActionResponse({
      error: banCheck.message,
      status: "ERROR",
    });
  }

  const { title, description, category, link, buyMeACoffeeUsername } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch"),
  );

  const slug = slugify(title as string, { lower: true, strict: true });

  try {
    const startup = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: slug,
        current: slug,
      },
      pitch,
      buyMeACoffeeUsername: buyMeACoffeeUsername || undefined,
    };

    const result = await writeClient
      .patch(startupId)
      .set(startup)
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deletePitch = async (startupId: string) => {
  const session = await getSession();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  try {
    // Remove all references to this startup in other documents
    const referencingDocs = await writeClient.fetch(`*[_type != "startup" && references($startupId)]{ _id }`, { startupId });
    for (const doc of referencingDocs) {
      // Remove reference from arrays or fields
      await writeClient.patch(doc._id)
        .unset([`category`, `startup`, `startups`]) // Adjust field names as needed
        .commit();
    }

    await writeClient.delete(startupId);
    // Also delete from Pinecone
    const { AIVectorSync } = await import("@/lib/ai-vector-sync");
    await AIVectorSync.deleteStartup(startupId);

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};