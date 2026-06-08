import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  isEmailSent: boolean;
  emailSentAt?: string;
  readAt?: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  startup?: {
    _id: string;
    title: string;
    slug: string;
  };
  interestedSubmission?: {
    _id: string;
    name: string;
    email: string;
  };
  metadata?: {
    startupTitle?: string;
    senderName?: string;
    senderEmail?: string;
  };
}

export interface NotificationPagination {
  total: number;
  unread: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: NotificationPagination | null;
  fetchNotifications: (options?: { unreadOnly?: boolean; limit?: number; offset?: number }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<NotificationPagination | null>(null);

  const fetchNotifications = useCallback(async (options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.pagination.unread);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setError(data.message || 'Failed to mark notification as read');
      }
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
      } else {
        setError(data.message || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/delete?id=${notificationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
        // Check if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setError(data.message || 'Failed to delete notification');
      }
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Fetch notifications on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
}