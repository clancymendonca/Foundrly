'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Heart, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  _id: string;
  type: 'like' | 'dislike' | 'comment' | 'reply' | 'follow' | 'interested_submission' | 'comment_like' | 'interested';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    startupId?: string;
    startupTitle?: string;
    senderId?: string;
    senderName?: string;
  };
}

export default function HomeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'dislike':
        return <Heart className="w-4 h-4 text-gray-500" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'comment_like':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'interested_submission':
      case 'interested':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 3);

  if (!session?.user?.id) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${notifications.length})`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No notifications yet</p>
          <p className="text-sm">You'll see notifications here when people interact with your content</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                !notification.isRead 
                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400">
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.location.href = '/notifications'}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
