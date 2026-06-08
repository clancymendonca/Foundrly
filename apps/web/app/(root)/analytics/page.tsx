import { Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, Users } from 'lucide-react';
import AnalyticsPageClient from '@/components/analytics/AnalyticsPageClient';
import MobilePageHeader from '@/components/layout/MobilePageHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const experimental_ppr = false;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const section = typeof sp?.section === 'string' ? sp.section : undefined;
  const hasStartup = typeof sp?.startup === 'string' ? true : false;
  return (
    <Suspense fallback={<div className="h-screen bg-white text-gray-900 flex items-center justify-center">Loading...</div>}>
      {/* Mobile Navigation Screen when no section/startup is selected */}
      {!section && !hasStartup && (
        <div className="lg:hidden h-screen bg-white text-gray-900 overflow-hidden px-4">
          <MobilePageHeader title="Your Analytics" />
          <div className="space-y-3">
            <Link href="/analytics?section=startup-analytics" className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold">Startup Analytics</p>
                  <p className="text-sm text-gray-600">Performance metrics for your startups.</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <Link href="/analytics?section=engagement-audience" className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold">Engagement & Network</p>
                  <p className="text-sm text-gray-600">Explore startups by categories and track your follower network growth.</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          </div>
        </div>
      )}

      {/* Full client on desktop always, and on mobile when a section/startup is selected */}
      {(!!section || hasStartup) && (
        <div className="lg:hidden px-4">
          <MobilePageHeader title="Analytics" />
        </div>
      )}
      <div className={(!!section || hasStartup) ? '' : 'hidden lg:block'}>
        <AnalyticsPageClient />
      </div>
    </Suspense>
  );
}
