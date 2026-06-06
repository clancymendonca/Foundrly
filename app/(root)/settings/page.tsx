import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";
import SettingsClient from "@/components/settings/SettingsClient";
import UserSidebarWrapper from "@/components/layout/UserSidebarWrapper";
import MobilePageHeader from "@/components/layout/MobilePageHeader";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch current user data from Sanity
  const currentUser = await client.fetch(AUTHOR_BY_ID_QUERY, {
    id: session.user.id
  });

  if (!currentUser) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <div className="lg:hidden px-4">
          <MobilePageHeader title="Settings" />
        </div>
        <SettingsClient currentUser={currentUser} />
      </div>
      <div className="hidden lg:block">
        <UserSidebarWrapper 
          userId={session.user.id} 
          isOwnProfile={true} 
        />
      </div>
    </div>
  );
}

