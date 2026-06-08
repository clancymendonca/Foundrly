import { NextRequest, NextResponse } from 'next/server';
import { syncStartupVector } from '@/lib/ai-vector-sync';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.VECTOR_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Server not configured: missing VECTOR_WEBHOOK_SECRET' }, { status: 500 });
    }

    const provided = req.headers.get('x-webhook-secret') || req.nextUrl.searchParams.get('secret') || '';
    if (provided !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const docId: string | undefined = body?.id || body?._id || body?.documentId;
    const action: 'create' | 'update' | 'delete' = body?.action === 'delete' ? 'delete' : (body?.action === 'update' ? 'update' : 'create');

    if (!docId) {
      return NextResponse.json({ success: false, error: 'Missing document id' }, { status: 400 });
    }

    await syncStartupVector(docId, action);
    return NextResponse.json({ success: true, action, id: docId });
  } catch (error) {
    console.error('Vector webhook error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}


