import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client';
import { getBadgesWithProgress } from '@/lib/badges/get-badges-with-progress';

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const author = await client.fetch<{ _id: string; isPrivate?: boolean } | null>(
    `*[_type == "author" && _id == $userId][0]{ _id, isPrivate }`,
    { userId },
  );

  if (!author) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isOwnProfile = session.user.id === userId;
  if (!isOwnProfile && author.isPrivate) {
    return NextResponse.json({ error: 'Profile private' }, { status: 403 });
  }

  try {
    const result = await getBadgesWithProgress(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to load badges with progress:', error);
    return NextResponse.json({ error: 'Failed to load badges' }, { status: 500 });
  }
}
