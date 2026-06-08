"use client";

import { useSession } from 'next-auth/react';
import ActivityMainContent from '@/components/activity/ActivityMainContent';
import MobilePageHeader from '@/components/layout/MobilePageHeader';

export default function ActivityInteractionsPage() {
  const { data: session } = useSession();
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
      <div className="lg:hidden px-4">
        <MobilePageHeader title="Interactions" />
      </div>
      <ActivityMainContent activeSection="interactions" />
    </div>
  );
}


