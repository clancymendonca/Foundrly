import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { client } from '@/sanity/lib/client';
import { isCurrentlyBanned } from '@/sanity/lib/moderation';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  
  // Check if the user is banned
  const user = await client.fetch(
    `*[_type == "author" && _id == $userId][0]{ _id, bannedUntil, isBanned, name, image }`,
    { userId }
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

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);
  // Ensure the user exists in Stream with display info so clients see names, not IDs
  try {
    await serverClient.upsertUser({
      id: userId,
      name: user?.name,
      image: user?.image,
    });
  } catch (e) {
    // Non-fatal: token can still be issued; log for visibility
    console.error('Failed to upsert Stream user on token request', e);
  }
  const token = serverClient.createToken(userId);
  return NextResponse.json({ token });
} 