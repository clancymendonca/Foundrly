'use client';
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BanCheckWrapper } from "@/components/moderation/BanCheckWrapper";

function FollowUnfollowButtonContent(props: {
  profileId: string;
  currentUserId?: string;
  followers?: any[];
  onFollowChange?: (updatedFollowers: any[], updatedFollowing: any[]) => void;
  isBanned: boolean;
  banMessage: string;
}) {
  const { profileId, currentUserId, followers = [], onFollowChange, isBanned, banMessage } = props;
  const isFollowing = Array.isArray(followers) && followers.some((f: any) => f._id === currentUserId);
  const [following, setFollowing] = useState(isFollowing);
  
  // Update local state when followers prop changes
  useEffect(() => {
    const newIsFollowing = Array.isArray(followers) && followers.some((f: any) => f._id === currentUserId);
    setFollowing(newIsFollowing);
  }, [followers, currentUserId]);

  const [isPressed, setIsPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFollowToggle = useCallback(async () => {
    if (isBanned) {
      toast({ 
        title: 'Account Suspended', 
        description: banMessage, 
        variant: 'destructive' 
      });
      return;
    }

    if (!profileId || !currentUserId) {
      toast({ 
        title: 'Error', 
        description: 'Missing user information. Please try logging in again.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    const action = following ? 'unfollow' : 'follow';
    
    // Optimistic update
    setFollowing(f => !f);
    
    // Prepare optimistic data for parent components
    const currentUser = {
      _id: currentUserId,
      name: 'You',
      username: 'you',
      image: null
    };
    
    const profileUser = {
      _id: profileId,
      name: 'User',
      username: 'user',
      image: null
    };

    let optimisticFollowers = [...followers];
    let optimisticFollowing: any[] = [];

    if (action === 'follow') {
      if (!isFollowing) {
        optimisticFollowers.push(currentUser);
      }
    } else {
      optimisticFollowers = optimisticFollowers.filter((f: any) => f._id !== currentUserId);
    }

    // Call parent callback with optimistic data
    if (onFollowChange) {
      onFollowChange(optimisticFollowers, optimisticFollowing);
    }
    
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, currentUserId, action }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (!data.success) {
        // Revert optimistic update on error
        setFollowing(f => !f);
        if (onFollowChange) {
          onFollowChange(followers, []);
        }
        toast({ 
          title: 'Error', 
          description: data.message || 'Failed to update follow status', 
          variant: 'destructive' 
        });
      } else {
        // Update with actual server data
        if (onFollowChange) {
          onFollowChange(data.followers || [], data.following || []);
        }
        toast({ 
          title: action === 'follow' ? 'Followed successfully' : 'Unfollowed successfully', 
          description: action === 'follow' ? `You are now following this user` : `You unfollowed this user`,
          variant: 'default' 
        });
      }
    } catch (e: any) {
      // Revert optimistic update on error
      setFollowing(f => !f);
      if (onFollowChange) {
        onFollowChange(followers, []);
      }
      console.error('Follow/unfollow error:', e);
      
      let errorMessage = 'Failed to update follow status';
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [following, isFollowing, profileId, currentUserId, followers, onFollowChange, isBanned, banMessage, toast]);

  // Don't render the button if viewing your own profile
  if (profileId === currentUserId) {
    return null;
  }

  // Don't render the button if user is banned
  if (isBanned) {
    return null;
  }

  return (
    <div className="flex justify-center mt-4">
      <Button
        variant={following ? "secondary" : "default"}
        onClick={handleFollowToggle}
        className={`transition-all duration-150 rounded-full px-3 py-3 shadow-md font-semibold flex items-center gap-2 text-base border-[5px] border-black bg-white text-black hover:bg-primary-100 hover:text-primary
          ${isPressed ? 'scale-95' : ''}
        `}
        style={{ minWidth: 120 }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={loading}
      >
        {loading ? (following ? 'Following...' : 'Unfollowing...') : (following ? "Unfollow" : "Follow")}
      </Button>
    </div>
  );
}

export default function FollowUnfollowButton(props: {
  profileId: string;
  currentUserId?: string;
  followers?: any[];
  onFollowChange?: (updatedFollowers: any[], updatedFollowing: any[]) => void;
}) {
  return (
    <BanCheckWrapper>
      {({ isBanned, banMessage }) => (
        <FollowUnfollowButtonContent
          {...props}
          isBanned={isBanned}
          banMessage={banMessage}
        />
      )}
    </BanCheckWrapper>
  );
} 