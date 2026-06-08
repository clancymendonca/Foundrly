import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

function getDateRange(period: string) {
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now);
  if (period === '7d') start.setDate(now.getDate() - 7);
  else if (period === '30d') start.setDate(now.getDate() - 30);
  else if (period === '90d') start.setDate(now.getDate() - 90);
  else if (period === '12m') start.setMonth(now.getMonth() - 12);
  else start.setDate(now.getDate() - 30);
  const startIso = start.toISOString();
  const prevStart = new Date(start);
  const prevEnd = new Date(start);
  prevStart.setTime(prevStart.getTime() - (new Date(end).getTime() - new Date(startIso).getTime()));
  const prevStartIso = prevStart.toISOString();
  const prevEndIso = startIso;
  return { start: startIso, end, prevStart: prevStartIso, prevEnd: prevEndIso };
}

function getPeriodLength(period: string) {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 10;
    case '90d':
      return 12;
    case '12m':
      return 12;
    default:
      return 10;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startupId = searchParams.get('startupId');
  const period = searchParams.get('period') || '7d';

  if (!startupId) {
    return NextResponse.json({ success: false, message: 'Missing startupId' }, { status: 400 });
  }

  getDateRange(period); // currently unused

  try {
    const views = await client.fetch(`*[_type == "startup" && _id == $id][0].views`, { id: startupId });
    const value = typeof views === 'number' ? views : 0;
    const len = getPeriodLength(period);
    const series = Array.from({ length: len }, () => value);
    const today = new Date();
    const days = Array.from({ length: len }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (len - 1 - i));
      return d.toISOString().slice(0, 10);
    });

    return NextResponse.json({ success: true, currentSeries: series, prevSeries: series, currentDays: days, prevDays: days });
  } catch (e) {
    console.error('views analytics error', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}
