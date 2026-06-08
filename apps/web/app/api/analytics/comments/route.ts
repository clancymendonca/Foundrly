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

async function fetchCommentTimestamps(startupId: string, start: string, end: string) {
  return client.fetch(`*[_type == "comment" && startup._ref == $id && createdAt >= $start && createdAt <= $end]{ createdAt }`, { id: startupId, start, end });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startupId = searchParams.get('startupId');
  const period = searchParams.get('period') || '7d';

  if (!startupId) {
    return NextResponse.json({ success: false, message: 'Missing startupId' }, { status: 400 });
  }

  const { start, end, prevStart, prevEnd } = getDateRange(period);

  try {
    const current = await fetchCommentTimestamps(startupId, start, end);
    const previous = await fetchCommentTimestamps(startupId, prevStart, prevEnd);

    const bucketDaily = (timestamps: any[]) => {
      const map = new Map<string, number>();
      timestamps.forEach(t => {
        const day = new Date(t.createdAt).toISOString().slice(0, 10);
        map.set(day, (map.get(day) || 0) + 1);
      });
      const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const days = sorted.map(([d]) => d);
      const values = sorted.map(([_, v]) => v);
      return { days, values };
    };

    let { days: currentDays, values: currentSeries } = bucketDaily(current);
    let { days: prevDays, values: prevSeries } = bucketDaily(previous);

    const minPoints = 2;
    const desiredLen = getPeriodLength(period);
    if (currentSeries.length < minPoints || prevSeries.length < minPoints) {
      const count = await client.fetch(`count(*[_type == "comment" && startup._ref == $id])`, { id: startupId });
      const value = typeof count === 'number' ? count : 0;
      const fillValues = Array.from({ length: desiredLen }, () => value);
      const today = new Date();
      const fillDays = Array.from({ length: desiredLen }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (desiredLen - 1 - i));
        return d.toISOString().slice(0, 10);
      });
      if (currentSeries.length < minPoints) {
        currentSeries = fillValues;
        currentDays = fillDays;
      }
      if (prevSeries.length < minPoints) {
        prevSeries = fillValues;
        prevDays = fillDays;
      }
    }

    return NextResponse.json({ success: true, currentSeries, prevSeries, currentDays, prevDays });
  } catch (e) {
    console.error('comments analytics error', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}
