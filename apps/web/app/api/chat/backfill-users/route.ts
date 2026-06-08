import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { client } from '@/sanity/lib/client';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

// POST /api/chat/backfill-users
// Body: { userIds?: string[], all?: boolean, limit?: number }
// - If userIds provided, backfills those
// - If all=true, fetches up to `limit` authors from Sanity and backfills
export async function POST(req: NextRequest) {
  try {
    const { userIds, all, limit = 1000 } = await req.json().catch(() => ({}));

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    let idsToBackfill: string[] = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      idsToBackfill = userIds;
    } else if (all) {
      // Caution: cap to `limit` to avoid huge requests
      const authors: Array<{ _id: string }> = await client.fetch(
        `*[_type == "author"][0...$limit]{ _id }`,
        { limit }
      );
      idsToBackfill = (authors || []).map(a => a._id);
    } else {
      return NextResponse.json({
        error: 'Provide userIds array or set all=true',
      }, { status: 400 });
    }

    if (idsToBackfill.length === 0) {
      return NextResponse.json({ success: true, updated: 0, skipped: 0 });
    }

    // Fetch profiles in one go
    const profiles: Array<{ _id: string; name?: string; image?: string }>= await client.fetch(
      `*[_type == "author" && _id in $ids]{ _id, name, image }`,
      { ids: idsToBackfill }
    );
    const idToProfile: Record<string, { name?: string; image?: string }> = Object.fromEntries(
      (profiles || []).map(p => [p._id, { name: p.name, image: p.image }])
    );

    // Batch upserts to stay within API limits
    const batchSize = 100;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (let i = 0; i < idsToBackfill.length; i += batchSize) {
      const slice = idsToBackfill.slice(i, i + batchSize);
      const users = slice.map(id => ({
        id,
        name: idToProfile[id]?.name,
        image: idToProfile[id]?.image,
      }));
      try {
        await serverClient.upsertUsers(users);
        updated += users.length;
      } catch (e: any) {
        failed += users.length;
        // Try one-by-one to identify problematic IDs
        for (const u of users) {
          try {
            await serverClient.upsertUser(u);
            updated += 1;
            failed -= 1;
          } catch (ie: any) {
            errors.push({ id: u.id, error: ie?.message || 'unknown' });
          }
        }
      }
    }

    return NextResponse.json({ success: true, updated, failed, errors });
  } catch (error: any) {
    console.error('Backfill users error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}


