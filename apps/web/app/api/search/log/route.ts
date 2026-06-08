import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { writeClient } from '@/sanity/lib/write-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { term } = await request.json();
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Missing term' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;

    await writeClient.create({
      _type: 'searchEvent',
      userId: session.user.id,
      term: term.trim(),
      timestamp: new Date().toISOString(),
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging search event:', error);
    return NextResponse.json({ success: false, message: 'Failed to log search' }, { status: 500 });
  }
}


