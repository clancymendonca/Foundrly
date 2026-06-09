import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MyBadges from "@/components/badges/MyBadges";

export default async function MyBadgesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MyBadges userId={session.user.id} />
      </div>
    </div>
  );
}
















