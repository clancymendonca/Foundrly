import { NextRequest, NextResponse } from 'next/server';
import { isEmailConfigured, sendTestEmail } from '@/lib/email';
import { devOnlyGuard } from '@/lib/dev-only';

export async function POST(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    if (!isEmailConfigured()) {
      return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 500 });
    }

    const body = await req.json();
    const to: string = body?.to;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing "to"' }, { status: 400 });
    }

    const result = await sendTestEmail(to);
    return NextResponse.json({ success: true, messageId: result.messageId || 'ok' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}


