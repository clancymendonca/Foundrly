'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import SavedSidebar from "@/components/saved/SavedSidebar";
import SavedMainContent from "@/components/saved/SavedMainContent";
import UserSidebarWrapper from "@/components/layout/UserSidebarWrapper";
import MobilePageHeader from "@/components/layout/MobilePageHeader";

export default function SavedPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('saved-startups');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };
  
  if (!session?.user?.id) {
    return (
      <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your saved items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-white text-gray-900 overflow-hidden">
      <div className="lg:hidden px-4">
        <MobilePageHeader title="Saved" />
      </div>
      <div className="flex h-full">
        <SavedSidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <div className="flex-1 flex">
          <SavedMainContent 
            activeSection={activeSection}
          />
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

