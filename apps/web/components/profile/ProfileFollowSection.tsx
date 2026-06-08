'use client';
import { useState, useEffect, useCallback } from 'react';
import FollowUnfollowButton from './FollowUnfollowButton';
import FollowersFollowingToast from './FollowersFollowingToast';

export default function ProfileFollowSection({
  initialFollowers = [],
  initialFollowing = [],
  profileId,
  currentUserId,
}: {
  initialFollowers: any[];
  initialFollowing: any[];
  profileId: string;
  currentUserId?: string;
}) {
  const [followers, setFollowers] = useState(initialFollowers);
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  
  // Reduced polling frequency from 5 seconds to 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUser();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [profileId]);

  const refetchUser = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/user/${profileId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Priority': 'high'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setFollowers(Array.isArray(data.followers) ? data.followers : []);
          setFollowing(Array.isArray(data.following) ? data.following : []);
        }
      }
    } catch (error) {
      // Silently fail - keep existing data
      console.error('Failed to refetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const handleFollowChange = useCallback((updatedFollowers: any[], updatedFollowing: any[]) => {
    // Update state immediately with optimistic data
    setFollowers(updatedFollowers);
    setFollowing(updatedFollowing);
  }, []);

  return (
    <>
      <FollowersFollowingToast
        followers={followers}
        following={following}
        isLoading={isLoading}
        profileId={profileId}
        currentUserId={currentUserId}
        onFollowChange={refetchUser}
      />
      <FollowUnfollowButton
        profileId={profileId}
        currentUserId={currentUserId}
        followers={followers}
        onFollowChange={handleFollowChange}
      />
    </>
  );
} 