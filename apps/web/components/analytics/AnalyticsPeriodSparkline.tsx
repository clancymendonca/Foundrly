'use client';

import { useEffect, useState } from 'react';
import InlineSparkline from './InlineSparkline';

interface AnalyticsPeriodSparklineProps {
  startupId: string;
  currentValue: number;
  apiPath?: string; // e.g., /api/analytics/likes | /api/analytics/dislikes | /api/analytics/comments | /api/analytics/views
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
];

function normalizeSeries(arr: unknown): number[] | null {
  if (!Array.isArray(arr)) return null;
  const nums = arr.filter((v) => typeof v === 'number') as number[];
  return nums.length >= 2 ? nums : null;
}

function normalizeLabels(arr: unknown, len: number): string[] | null {
  if (!Array.isArray(arr)) return null;
  const strs = arr.filter((v) => typeof v === 'string') as string[];
  return strs.length === len ? strs : null;
}

export default function AnalyticsPeriodSparkline({ startupId, apiPath = '/api/analytics/likes' }: AnalyticsPeriodSparklineProps) {
  const [period, setPeriod] = useState('7d');
  const [currentSeries, setCurrentSeries] = useState<number[] | null>(null);
  const [prevSeries, setPrevSeries] = useState<number[] | null>(null);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiPath}?startupId=${encodeURIComponent(startupId)}&period=${encodeURIComponent(period)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error('Bad response');
        const curr = normalizeSeries(data.currentSeries);
        const prev = normalizeSeries(data.prevSeries);
        const labs = normalizeLabels(data.currentDays, Array.isArray(curr) ? curr.length : 0);
        setCurrentSeries(curr);
        setPrevSeries(prev);
        setLabels(labs);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSeries();
    return () => { cancelled = true; };
  }, [startupId, period, apiPath]);

  const hasData = currentSeries && prevSeries;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <label className="mr-2 text-sm text-gray-600" htmlFor={`period-select-${startupId}`}>Period</label>
        <select
          id={`period-select-${startupId}`}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-md text-sm px-2 py-1 bg-white"
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="p-4 text-sm text-gray-500">Loading likes analytics…</div>
      )}

      {!loading && !hasData && !error && (
        <div className="p-4 text-sm text-gray-500">No likes data for the selected period.</div>
      )}

      {!loading && error && (
        <div className="p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && hasData && (
        <InlineSparkline
          width={'100%'}
          height={180}
          labels={labels || undefined}
          series={[
            { name: 'Current', color: '#2563eb', points: currentSeries! },
            { name: 'Prev', color: '#9ca3af', points: prevSeries! },
          ]}
        />
      )}
    </div>
  );
}
