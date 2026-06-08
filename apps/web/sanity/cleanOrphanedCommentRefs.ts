import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from 'next-sanity';

function assertValue(value: string | undefined, errorMessage: string): string {
  if (!value) throw new Error(errorMessage);
  return value;
}

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-02';
const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
);
const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
);
const token = assertValue(
  process.env.SANITY_WRITE_TOKEN,
  'Missing environment variable: SANITY_WRITE_TOKEN'
);

// Create standalone clients
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

async function cleanOrphanedCommentRefs() {
  // 1. Get all valid comment IDs
  const allComments = await client.fetch(`*[_type == "comment"]._id`);
  const validCommentIds = new Set(allComments);

  // 2. Find all startups with comments
  const startups = await client.fetch(`*[_type == "startup" && defined(comments)]{_id, comments}`);
  for (const startup of startups) {
    const filtered = startup.comments.filter((ref: any) => validCommentIds.has(ref._ref));
    if (filtered.length !== startup.comments.length) {
      await writeClient.patch(startup._id).set({ comments: filtered }).commit();
      console.log(`Cleaned comments for startup ${startup._id}`);
    }
  }

  // 3. Find all comments with replies
  const comments = await client.fetch(`*[_type == "comment" && defined(replies)]{_id, replies}`);
  for (const comment of comments) {
    const filtered = comment.replies.filter((ref: any) => validCommentIds.has(ref._ref));
    if (filtered.length !== comment.replies.length) {
      await writeClient.patch(comment._id).set({ replies: filtered }).commit();
      console.log(`Cleaned replies for comment ${comment._id}`);
    }
  }

  console.log('Cleanup complete!');
}

cleanOrphanedCommentRefs().catch(err => {
  console.error('Error cleaning orphaned comment references:', err);
  process.exit(1);
}); 