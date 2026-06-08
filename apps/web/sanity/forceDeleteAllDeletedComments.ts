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

async function forceDeleteComment(commentId: string) {
  // --- logic from forceDeleteComment.ts ---
  try {
    // Get the comment details
    const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]{_id, text, startup, parent, author->{name}}`, { id: commentId });
    if (!comment) {
      return;
    }
    // Find comments that have this as a parent
    const childComments = await client.fetch(`*[_type == "comment" && parent._ref == $commentId]{_id}`, { commentId });
    // Recursively delete child comments first
    for (const child of childComments) {
      await forceDeleteComment(child._id);
    }
    // Remove from all referencing docs
    const allDocsWithRef = await client.fetch(`*[references($commentId)]{_id, _type}`, { commentId });
    for (const doc of allDocsWithRef) {
      if (doc._type === 'startup') {
        await writeClient.patch(doc._id).unset([`comments[_ref==\"${commentId}\"]`]).commit();
      } else if (doc._type === 'comment') {
        await writeClient.patch(doc._id).unset([`replies[_ref==\"${commentId}\"]`]).commit();
      }
    }
    // Delete the comment itself
    await writeClient.delete(commentId);
    console.log(`✅ Deleted comment ${commentId}`);
  } catch (error) {
    console.error(`❌ Error deleting comment ${commentId}:`, error);
  }
}

async function main() {
  // Find all comments marked as deleted
  const deletedComments = await client.fetch(`*[_type == "comment" && deleted == true]{_id}`);
  if (deletedComments.length === 0) {
    console.log('✅ No deleted comments found!');
    return;
  }
  console.log(`🧹 Found ${deletedComments.length} deleted comments. Starting recursive force delete...`);
  for (const comment of deletedComments) {
    await forceDeleteComment(comment._id);
  }
  // Verify
  const stillDeleted = await client.fetch(`*[_type == "comment" && deleted == true]{_id}`);
  if (stillDeleted.length === 0) {
    console.log('🎉 All deleted comments have been force deleted!');
  } else {
    console.log(`⚠️  ${stillDeleted.length} deleted comments still remain (check for reference cycles)`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
}); 