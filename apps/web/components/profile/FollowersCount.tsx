"use client";

import FollowersFollowingToast from "@/components/profile/FollowersFollowingToast";

interface FollowersCountProps {
  followers: any[];
  following: any[];
  profileId: string;
  currentUserId?: string;
}

export default function FollowersCount({ followers, following, profileId, currentUserId }: FollowersCountProps) {
  return (
    <FollowersFollowingToast
      followers={followers}
      following={following}
      profileId={profileId}
      currentUserId={currentUserId}
    />
  );
} 