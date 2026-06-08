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
      return 10; // bucketed
    case '90d':
      return 12; // bucketed
    case '12m':
      return 12;
    default:
      return 10;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startupId = searchParams.get('startupId');
  const period = searchParams.get('period') || '30d';

  if (!startupId) {
    return NextResponse.json({ success: false, message: 'Missing startupId' }, { status: 400 });
  }

  const { start, end, prevStart, prevEnd } = getDateRange(period);

  try {
    const currentEvents = await client.fetch(`*[_type == "startupLikeEvent" && startupId == $startupId && timestamp >= $start && timestamp <= $end]{ timestamp, action }`, { startupId, start, end });
    const prevEvents = await client.fetch(`*[_type == "startupLikeEvent" && startupId == $startupId && timestamp >= $prevStart && timestamp <= $prevEnd]{ timestamp, action }`, { startupId, prevStart, prevEnd });

    const bucketDaily = (events: any[]) => {
      const map = new Map<string, number>();
      events.forEach(e => {
        const day = new Date(e.timestamp).toISOString().slice(0, 10);
        const delta = e.action === 'like' ? 1 : -1;
        map.set(day, (map.get(day) || 0) + delta);
      });
      const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const days = sorted.map(([d]) => d);
      const values = sorted.map(([_, v]) => v);
      return { days, values };
    };

    let { days: currentDays, values: currentSeries } = bucketDaily(currentEvents);
    let { days: prevDays, values: prevSeries } = bucketDaily(prevEvents);

    // If insufficient event data, backfill with current likes count for visibility
    const minPoints = 2;
    const desiredLen = getPeriodLength(period);
    if (currentSeries.length < minPoints || prevSeries.length < minPoints) {
      const likesCount = await client.fetch(`*[_type == "startup" && _id == $id][0].likes`, { id: startupId });
      const value = typeof likesCount === 'number' ? likesCount : 0;
      
      // Calculate the actual current value from the events
      const currentValue = currentEvents.reduce((sum, event) => sum + (event.action === 'like' ? 1 : -1), 0);
      const prevValue = prevEvents.reduce((sum, event) => sum + (event.action === 'like' ? 1 : -1), 0);
      
      // Use the calculated values instead of the database count
      const currentFillValue = Math.max(0, currentValue);
      const prevFillValue = Math.max(0, prevValue);
      
      const today = new Date();
      const fillDays = Array.from({ length: desiredLen }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (desiredLen - 1 - i));
        return d.toISOString().slice(0, 10);
      });
      
      if (currentSeries.length < minPoints) {
        currentSeries = Array.from({ length: desiredLen }, () => currentFillValue);
        currentDays = fillDays;
      }
      if (prevSeries.length < minPoints) {
        prevSeries = Array.from({ length: desiredLen }, () => prevFillValue);
        prevDays = fillDays;
      }
    }

    return NextResponse.json({ success: true, currentSeries, prevSeries, currentDays, prevDays });
  } catch (e) {
    console.error('likes analytics error', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}
