import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import UserStartups from "@/components/startup/UserStartups";
import { Suspense } from "react";
import { StartupCardSkeleton } from "@/components/startup/StartupCard";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";
import ProfileFollowWrapper from "@/components/profile/ProfileFollowWrapper";
import { Button } from "@/components/ui/button";
import UserSaveButton from "@/components/saved/UserSaveButton";
import BadgeLabels from "@/components/badges/BadgeLabels";
import { enhancedBadgeSystem, TIER_LEVELS } from "@/lib/badges/enhanced-badge-system";
import UserSidebarWrapper from "@/components/layout/UserSidebarWrapper";

export const experimental_ppr = true;

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await auth();
  const user = await client.fetch(AUTHOR_BY_ID_QUERY, { id });
  if (!user) return notFound();

  // Initialize badge system
  await enhancedBadgeSystem.initialize();
  
  // Fetch evolving badges for the user
  const evolvingBadges = await enhancedBadgeSystem.getEvolvingBadges(id);
  
  // Fetch earned badges for display
  const userBadges = await client.fetch(`
    *[_type == "userBadge" && user._ref == $userId] {
      _id,
      earnedAt,
      badge->{
        _id,
        name,
        description,
        category,
        icon,
        color,
        rarity,
        tier,
        isActive
      }
    }[badge.isActive == true] | order(earnedAt desc)
  `, { userId: id });

  // Find the highest tier for each category and combine into single carousel
  const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
  const earnedBadges = userBadges.map((ub: any) => ub.badge).filter((badge: any) => badge && badge.tier && badge.category);
  
  // Group badges by category and find highest tier for each
  const categoryHighestTiers: { [category: string]: { tier: string; badges: any[] } } = {};
  let allHighestTierBadges: any[] = [];
  
  if (earnedBadges.length > 0) {
    // Group badges by category
    const badgesByCategory: { [category: string]: any[] } = {};
    earnedBadges.forEach((badge: any) => {
      if (!badgesByCategory[badge.category]) {
        badgesByCategory[badge.category] = [];
      }
      badgesByCategory[badge.category].push(badge);
    });
    
    // Find highest tier for each category
    Object.keys(badgesByCategory).forEach(category => {
      const categoryBadges = badgesByCategory[category];
      const highestTierBadge = categoryBadges.reduce((highest: any, badge: any) => {
        const currentTierOrder = tierOrder[badge.tier as keyof typeof tierOrder] || 0;
        const highestTierOrder = tierOrder[highest.tier as keyof typeof tierOrder] || 0;
        return currentTierOrder > highestTierOrder ? badge : highest;
      }, categoryBadges[0]);
      
      const highestTier = highestTierBadge.tier;
      const highestTierBadges = categoryBadges.filter((badge: any) => badge.tier === highestTier);
      
      categoryHighestTiers[category] = {
        tier: highestTier,
        badges: highestTierBadges
      };
      
      // Add all highest tier badges to the combined array
      allHighestTierBadges.push(...highestTierBadges);
    });
  }

  // Show evolving badges by default

  const isOwnProfile = session?.user?.id === id;

  return (
    <>
      <section className="profile_container">
        <div className="profile_card">
          <div className="profile_title">
            <h3 className="text-24-black uppercase text-center line-clamp-1">
              {user.name}
            </h3>
          </div>

          <Image
            src={user.image}
            alt={user.name}
            width={220}
            height={220}
            className="profile_image"
          />

          <p className="text-30-extrabold mt-7 text-center">
            @{user?.username}
          </p>
          <p className="mt-1 text-center text-14-normal">{user?.bio}</p>
          
          {/* Highest Tier Badges */}
          {allHighestTierBadges.length > 0 && (
            <div className="mt-4 w-full">
              <BadgeLabels 
                badges={allHighestTierBadges} 
                maxDisplay={6} 
                showRarity={true} 
                showTier={true}
                compact={true} 
              />
            </div>
          )}

          <div className="mt-1 flex flex-col items-center justify-center gap-1">
            <ProfileFollowWrapper
              initialFollowers={user.followers || []}
              initialFollowing={user.following || []}
              profileId={id}
              currentUserId={session?.user?.id}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-5 lg:-mt-5">
          <div className="flex items-center justify-between gap-3 w-full">
            <p className="text-30-bold">
              {isOwnProfile ? "Your" : "All"} Startups
            </p>
            <UserSaveButton profileId={id} currentUserId={session?.user?.id} />
          </div>
          <ul className="card_grid-sm">
            <Suspense fallback={<StartupCardSkeleton />}>
              <UserStartups id={id} sessionId={session?.user?.id} />
            </Suspense>
          </ul>
        </div>
      </section>

      {/* User Sidebar - Only show for own profile; hide on mobile */}
      <div className="hidden lg:block">
        <UserSidebarWrapper userId={id} isOwnProfile={isOwnProfile} />
      </div>
    </>
  );
};

export default Page;