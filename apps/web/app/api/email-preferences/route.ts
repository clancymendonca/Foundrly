import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { getUserEmailPreferences, setUserEmailPreferences } from '@/sanity/lib/user-preferences';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const prefs = await getUserEmailPreferences(session.user.id);
  return NextResponse.json({ success: true, preferences: prefs });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await setUserEmailPreferences(session.user.id, body?.preferences || {});
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update preferences' }, { status: 400 });
  }
}



