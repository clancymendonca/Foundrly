import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, UserPlus, Users, Heart } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  followers?: any[];
  following?: any[];
  type?: 'follower' | 'mutual' | 'other';
}

interface SuggestedUsersProps {
  onSelectUser?: (user: User) => void;
  onStartChat?: (chatId: string, user: User) => void;
  maxResults?: number;
}

export default function SuggestedUsers({ 
  onSelectUser, 
  onStartChat,
  maxResults = 10 
}: SuggestedUsersProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  const fetchSuggestedUsers = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        currentUserId: session.user.id,
        limit: maxResults.toString()
      });

      const response = await fetch(`/api/users/suggested?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load suggested users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, [session?.user?.id]);

  const handleUserSelect = async (user: User) => {
    if (!session?.user?.id) return;

    setCreatingChat(user._id);

    try {
      
      // First, create/upsert the user in Stream Chat
      const upsertResponse = await fetch('/api/chat/upsert-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user._id,
          name: user.name,
          image: user.image
        }),
      });

      if (!upsertResponse.ok) {
        const upsertError = await upsertResponse.text();
        console.error('Upsert user error:', upsertError);
        throw new Error(`Failed to create user in Stream Chat: ${upsertError}`);
      }



      // Create a new chat channel
      const chatResponse = await fetch('/api/chat/create-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          memberIds: [session.user.id, user._id],
          channelData: {
            name: `Chat with ${user.name}`,
            image: user.image
          }
        }),
      });

      if (!chatResponse.ok) {
        const chatError = await chatResponse.json();
        console.error('Create channel error:', chatError);
        throw new Error(`Failed to create chat channel: ${chatError.details || chatError.error || 'Unknown error'}`);
      }

      const { channelId } = await chatResponse.json();

      // Call the onStartChat callback if provided
      if (onStartChat) {
        onStartChat(channelId, user);
      } else {
        // Fallback: just call onSelectUser
        onSelectUser(user);
      }

    } catch (err) {
      console.error('Error creating chat:', err);
      setError(`Failed to start chat: ${err.message}`);
    } finally {
      setCreatingChat(null);
    }
  };

  const getUserTypeLabel = (type?: string) => {
    switch (type) {
      case 'follower':
        return { label: 'Follows you', icon: <Users className="w-3 h-3" />, color: 'text-blue-600' };
      case 'mutual':
        return { label: 'Mutual', icon: <Heart className="w-3 h-3" />, color: 'text-green-600' };
      default:
        return { label: '', icon: null, color: '' };
    }
  };

  const getUserTypeBadge = (type?: string) => {
    const typeInfo = getUserTypeLabel(type);
    if (!typeInfo.label) return null;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${typeInfo.color} font-medium`}>
        {typeInfo.icon}
        {typeInfo.label}
      </div>
    );
  };

  if (!session?.user?.id) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to see suggested users
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No suggested users available
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${creatingChat === user._id ? 'opacity-50' : ''}`}
                onClick={() => !creatingChat && handleUserSelect(user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">
                        {user.name?.[0] || user.username?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 truncate">
                        {user.name}
                      </div>
                      {getUserTypeBadge(user.type)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      @{user.username}
                    </div>
                    {user.bio && (
                      <div className="text-xs text-gray-400 truncate mt-1">
                        {user.bio}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {creatingChat === user._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <>
                      <button
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/user/${user._id}`}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 