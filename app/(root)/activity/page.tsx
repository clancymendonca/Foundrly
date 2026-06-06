'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ActivitySidebar from "@/components/activity/ActivitySidebar";
import ActivityMainContent from "@/components/activity/ActivityMainContent";
import UserSidebarWrapper from "@/components/layout/UserSidebarWrapper";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import Link from 'next/link';
import { RotateCcw, Calendar, Megaphone } from 'lucide-react';

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('interactions');

  // Debug: Log state changes
  console.log('ActivityPage state:', { activeSection, session: !!session?.user?.id });

  const handleSectionChange = (section: string) => {
    console.log('ActivityPage: Section change requested:', section);
    setActiveSection(section);
  };

  if (!session?.user?.id) {
    return (
      <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-gray-900 overflow-hidden">
      {/* Mobile Navigation Screen */}
      <div className="lg:hidden h-full px-4">
        <MobilePageHeader title="Your activity" />
        <div className="space-y-3">
          <Link href="/activity/interactions" className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold">Interactions</p>
                <p className="text-sm text-gray-600">Review likes, comments, and more</p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link href="/activity/account-history" className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold">Account History</p>
                <p className="text-sm text-gray-600">Changes you've made to your account</p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link href="/activity/ad-activity" className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold">Ad Activity</p>
                <p className="text-sm text-gray-600">Ads you've interacted with</p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        <ActivitySidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <div className="flex-1 flex">
          <ActivityMainContent activeSection={activeSection} />
          <div className="hidden lg:block">
            <UserSidebarWrapper 
              userId={session.user.id} 
              isOwnProfile={true} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
