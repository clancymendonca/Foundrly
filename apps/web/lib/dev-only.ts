import { NextResponse } from 'next/server';

/** Returns a 404 response in production; null when dev routes are allowed. */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
