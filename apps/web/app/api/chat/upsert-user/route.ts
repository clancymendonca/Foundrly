import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { client } from '@/sanity/lib/client';
import { AUTHOR_BY_ID_QUERY } from '@/sanity/lib/queries';
import { isCurrentlyBanned } from '@/sanity/lib/moderation';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  const { id, name: reqName, image: reqImage } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  
  // Check if the user is banned
  const user = await client.fetch(
    `*[_type == "author" && _id == $id][0]{ _id, bannedUntil, isBanned, name, image }`,
    { id }
  );

  if (user?.isBanned) {
    const isCurrentlyBannedUser = isCurrentlyBanned(user.bannedUntil, user.isBanned);
    if (isCurrentlyBannedUser) {
      return NextResponse.json({
        error: 'Account is suspended. You cannot send messages.',
        details: 'Your account has been suspended due to a violation of our community guidelines.'
      }, { status: 403 });
    }
  }

  let name = reqName;
  let image = reqImage;
  
  // Use user info from Sanity if available
  if (user) {
    name = user.name || name;
    image = user.image || image;
  }
  const serverClient = StreamChat.getInstance(apiKey, apiSecret);
  await serverClient.upsertUser({ id, name, image });
  return NextResponse.json({ success: true });
} 