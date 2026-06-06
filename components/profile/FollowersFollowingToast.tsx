'use client';
import { useState, useCallback } from "react";
import FollowersModal from "./FollowersModal";

export default function FollowersFollowingToast({ 
  followers = [], 
  following = [], 
  isLoading = false,
  profileId,
  currentUserId,
  onFollowChange
}: { 
  followers: any[]; 
  following: any[]; 
  isLoading?: boolean;
  profileId: string;
  currentUserId?: string;
  onFollowChange?: () => void;
}) {
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<any[]>([]);

  // Coerce to arrays to avoid null/undefined errors
  const safeFollowers = Array.isArray(followers) ? followers : [];
  const safeFollowing = Array.isArray(following) ? following : [];

  const showList = useCallback(
    async (type: 'followers' | 'following') => {
      // Open modal instantly with current data
      setModalType(type);
      const initialUsers = type === 'followers' ? safeFollowers : safeFollowing;
      setModalUsers(initialUsers);
      
      // Fetch fresh data in background (non-blocking)
      fetch(`/api/user/${profileId}/resolved`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Priority': 'high'
        }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          const users = type === 'followers' ? data.followers : data.following;
          setModalUsers(users);
        }
      })
      .catch(() => {
        // Silently fail - keep current data
      });
    },
    [profileId, safeFollowers, safeFollowing]
  );

  const closeModal = () => {
    setModalType(null);
    setModalUsers([]);
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1 font-bold mt-0.5 text-[16px] whitespace-nowrap">
        <span
          className={`${safeFollowers.length ? 'cursor-pointer hover:text-white' : 'cursor-default'}`}
          onClick={() => showList('followers')}
        >
          {safeFollowers.length} followers
        </span>
        <span aria-hidden>·</span>
        <span
          className={`${safeFollowing.length ? 'cursor-pointer hover:text-white' : 'cursor-default'}`}
          onClick={() => showList('following')}
        >
          {safeFollowing.length} following
        </span>
      </div>

      {/* Modal */}
      <FollowersModal
        isOpen={modalType !== null}
        onClose={closeModal}
        type={modalType || 'followers'}
        users={modalUsers}
        currentUserId={currentUserId}
        onFollowChange={onFollowChange}
        currentUserFollowing={following}
        profileId={profileId}
      />
    </>
  );
} 