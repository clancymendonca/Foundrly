import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import MyBadges from "@/components/badges/MyBadges";
import AllBadges from "@/components/badges/AllBadges";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ user?: string }>;
}

export default async function BadgesPage({ searchParams }: PageProps) {
  const { user: userId } = await searchParams;
  const session = await auth();
  
  // If no user parameter, show all badges
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🏆 All Badges
            </h1>
            <p className="text-gray-600 text-lg">
              Discover all the badges you can earn in our community. Complete challenges, engage with others, and build your legacy!
            </p>
          </div>
          
          <AllBadges />

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10 text-center">
              <h3 className="text-3xl font-bold mb-4">Ready to Build Your Legacy?</h3>
              <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
                Join the ranks of successful founders. Create, engage, and earn recognition in our growing community of innovators.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link href="/startup/create">
                  <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    🚀 Launch Your Startup
                  </button>
                </Link>
                <Link href="/badges">
                  <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105">
                    🏆 View All Badges
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verify the user exists
  const user = await client.fetch(`
    *[_type == "author" && _id == $userId][0] {
      _id,
      name,
      username,
      image
    }
  `, { userId });

  if (!user) {
    return notFound();
  }

  // Check if current user can view this profile
  const canView = session?.user?.id === userId || !user.isPrivate;

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Private</h1>
          <p className="text-gray-600">This user's badges are not publicly visible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {user.image && (
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name}'s Badges
              </h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </div>
        </div>
        
        <MyBadges userId={userId} />

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Build Your Legacy?</h3>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Join the ranks of successful founders. Create, engage, and earn recognition in our growing community of innovators.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/startup/create">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  🚀 Launch Your Startup
                </button>
              </Link>
              <Link href="/badges">
                <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105">
                  🏆 View All Badges
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
