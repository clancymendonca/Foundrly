import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";
import Link from "next/link";

type Follower = {
  _id: string;
  username: string;
  name: string;
  image: string;
  isFollowingBack?: boolean;
};

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  users: Follower[];
  currentUserId?: string;
  onFollowChange?: () => void;
  currentUserFollowing?: any[]; 
  profileId?: string; 
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  type,
  users,
  currentUserId,
  onFollowChange,
  currentUserFollowing = [],
  profileId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Follower[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [recentlyUnfollowed, setRecentlyUnfollowed] = useState<Record<string, number>>({});
  const [modalUsers, setModalUsers] = useState<Follower[]>(users);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && profileId) {
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
          const freshUsers = type === 'followers' ? data.followers : data.following;
          setModalUsers(freshUsers);
        }
      })
      .catch(() => {
      });
    } else {
      setModalUsers(users);
    }
  }, [isOpen, profileId, type, users]);

  useEffect(() => {
    const filtered = modalUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [modalUsers, searchTerm]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30000; 
      
      setRecentlyUnfollowed(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(userId => {
          if (newState[userId] < thirtySecondsAgo) {
            delete newState[userId];
          }
        });
        return newState;
      });

      if (isOpen && profileId) {
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
            const freshUsers = type === 'followers' ? data.followers : data.following;
            setModalUsers(freshUsers);
          }
        })
        .catch(() => {
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(cleanupInterval);
  }, [isOpen, profileId, type]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleFollowToggle = async (userId: string, username: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) {
      toast({ 
        title: 'Error', 
        description: 'Please log in to follow users', 
        variant: 'destructive' 
      });
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    
    // Optimistic update
    if (isCurrentlyFollowing) {
      setModalUsers(prev => prev.filter(user => user._id !== userId));
      setRecentlyUnfollowed(prev => ({
        ...prev,
        [userId]: Date.now()
      }));
    } else {
      setRecentlyUnfollowed(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
    
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileId: userId, 
          currentUserId, 
          action: isCurrentlyFollowing ? 'unfollow' : 'follow'
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: 'Success', 
          description: isCurrentlyFollowing 
            ? `You unfollowed ${username}` 
            : `You are now following ${username}`, 
          variant: 'default' 
        });
        
        // Update with server data if available
        if (data.followers || data.following) {
          const updatedUsers = type === 'followers' ? data.followers : data.following;
          if (Array.isArray(updatedUsers)) {
            setModalUsers(updatedUsers);
          }
        }
        
        if (onFollowChange) {
          onFollowChange();
        }
      } else {
                 // Revert optimistic update on error
         if (isCurrentlyFollowing) {
           // Re-add the user back to the list
           const userToReadd = recentlyUnfollowed[userId] ? 
             { _id: userId, name: username, username, image: '' } : null;
           if (userToReadd) {
             setModalUsers(prev => [...prev, userToReadd]);
           }
         }
        throw new Error(data.message || 'Failed to update follow status');
      }
    } catch (error: any) {
      console.error('Follow/unfollow error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update follow status', 
        variant: 'destructive' 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRemoveFollower = async (userId: string, username: string) => {
    if (!currentUserId) {
      toast({ 
        title: 'Error', 
        description: 'Please log in to remove followers', 
        variant: 'destructive' 
      });
      return;
    }
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileId: currentUserId, 
          currentUserId: userId, 
          action: 'remove_follower'
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: 'Success', 
          description: `Removed ${username} from your followers`, 
          variant: 'default' 
        });
        
        
        setModalUsers(prev => {
          const filtered = prev.filter(user => user._id !== userId);
          return filtered;
        });
        
        if (onFollowChange) onFollowChange();
        
        
        setTimeout(() => {
          fetch(`/api/user/${profileId}/resolved?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Priority': 'high'
            }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const updatedUsers = type === 'followers' ? data.followers : data.following;
              setModalUsers(updatedUsers);
            }
          })
          .catch((error) => {
            console.error('Error refreshing modal data (remove):', error);
          });
        }, 100); 
      } else {
        throw new Error(data.message || 'Failed to remove follower');
      }
    } catch (error: any) {
      console.error('Remove follower error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to remove follower', 
        variant: 'destructive' 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] bg-black bg-opacity-70 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[400px] bg-white text-black rounded-[22px] overflow-hidden shadow-lg border-[5px] border-blue-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200 bg-blue-50">
          <h2 className="text-lg font-semibold capitalize text-blue-700">{type}</h2>
          <button 
            onClick={onClose}
            className="hover:bg-blue-100 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5 text-blue-700" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-blue-100 bg-blue-50">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white text-black border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* User List */}
        <div className="h-96 overflow-y-auto bg-white">
          {filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-blue-400">
              {searchTerm ? 'No users found' : `No ${type} yet`}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors border-b border-blue-50 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Link href={`/user/${user._id}`} className="hover:opacity-80 transition-opacity">
                    <Image
                      src={user.image}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 cursor-pointer"
                    />
                  </Link>
                  <Link href={`/user/${user._id}`} className="hover:opacity-80 transition-opacity">
                    <div>
                      <p className="text-sm font-medium text-blue-900 cursor-pointer">{user.username}</p>
                      <p className="text-xs text-blue-400 cursor-pointer">
                        {user.name || "\u00A0"}
                      </p>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center space-x-2">
                  {currentUserId && user._id !== currentUserId && (
                    (() => {
                      
                      
                      const isFollowing = type === 'following' 
                        ? true 
                        : Array.isArray(currentUserFollowing) && 
                          currentUserFollowing.some((f: any) => f._ref === user._id);
                      
                      return (
                        <>
                          {/* Follow/Unfollow button for following list */}
                          {type === 'following' && (
                            <button 
                              className={`text-xs font-semibold rounded px-3 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${
                                isFollowing 
                                  ? 'bg-white text-blue-500 border-blue-500 hover:bg-blue-50' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                              }`}
                              onClick={() => handleFollowToggle(user._id, user.username, isFollowing)}
                              disabled={loadingStates[user._id]}
                            >
                              {loadingStates[user._id] 
                                ? (isFollowing ? 'Unfollowing...' : 'Following...') 
                                : (isFollowing ? 'Unfollow' : 'Follow')
                              }
                            </button>
                          )}
                          
                          {/* Remove button for followers list - only show on own profile */}
                          {type === 'followers' && profileId === currentUserId && (
                            <button 
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded px-3 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500"
                              onClick={() => handleRemoveFollower(user._id, user.username)}
                              disabled={loadingStates[user._id]}
                            >
                              {loadingStates[user._id] ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  
  return createPortal(modalContent, document.body);
};

export default FollowersModal; 