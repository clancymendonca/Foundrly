import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { syncUserBadges } from '@/lib/badges/sync-user-badges';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyUserId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    bodyUserId = body?.userId;
  } catch {
    bodyUserId = undefined;
  }

  const userId = bodyUserId || session.user.id;
  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await syncUserBadges(userId);
    return NextResponse.json({
      awarded: result.awarded,
      alreadyHad: result.alreadyHad,
      checked: result.checked,
    });
  } catch (error) {
    console.error('Failed to sync badges:', error);
    return NextResponse.json({ error: 'Failed to sync badges' }, { status: 500 });
  }
}
