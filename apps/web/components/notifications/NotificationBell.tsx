"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, MessageSquare, Heart, UserPlus, Eye, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/notifications/useNotifications';

export interface Notification {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  type: 'follow' | 'comment' | 'reply' | 'like' | 'comment_like' | 'report' | 'system' | 'mention' | 'interested_submission';
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
    commentText?: string;
    userName?: string;
    userImage?: string;
    parentCommentText?: string;
    reportReason?: string;
    reportStatus?: string;
    actionTaken?: string;
  };
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead
  } = useNotifications();

  // Memoize filtered notifications to prevent unnecessary recalculations
  const displayNotifications = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentNotifications = notifications.filter(notification => {
      const notificationDate = new Date(notification._createdAt);
      return notificationDate >= threeDaysAgo;
    });
    
    // Prioritize unread notifications, then sort by date
    const sortedNotifications = recentNotifications.sort((a, b) => {
      // First priority: unread notifications
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Second priority: most recent first
      return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
    });
    
    return sortedNotifications.slice(0, 5); // Limit to 5 for dropdown
  }, [notifications]); // Only recalculate when notifications change

  // Force re-render when notifications change (especially for markAllAsRead)
  useEffect(() => {
    // This ensures the component re-renders when notifications state changes
    // This is important for when markAllAsRead is called from the notifications page
  }, [notifications, unreadCount]);

  // Detect Tailwind sm breakpoint (mobile < 640px)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    };
    // Initialize and subscribe
    handler(mql);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    } else if (typeof (mql as any).addListener === 'function') {
      (mql as any).addListener(handler);
      return () => (mql as any).removeListener(handler);
    }
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-teal-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment_like':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'report':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case 'interested_submission':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return 'border-l-blue-500 bg-blue-50';
      case 'comment':
        return 'border-l-green-500 bg-green-50';
      case 'reply':
        return 'border-l-teal-500 bg-teal-50';
      case 'like':
        return 'border-l-red-500 bg-red-50';
      case 'comment_like':
        return 'border-l-pink-500 bg-pink-50';
      case 'report':
        return 'border-l-orange-500 bg-orange-50';
      case 'mention':
        return 'border-l-orange-500 bg-orange-500';
      case 'interested_submission':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    // Navigate to interested page for interested submission notifications
    if (notification.type === 'interested_submission') {
      window.location.href = '/interested';
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isMobile) {
            window.location.href = '/notifications';
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="relative flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
      >
        <Bell className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className="max-sm:hidden">Notifications</span>
      </button>

      {isOpen && !isMobile && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Dropdown */}
          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > displayNotifications.length && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing last 3 days • {notifications.length - displayNotifications.length} older hidden
                    {(() => {
                      const oldestNotification = notifications[notifications.length - 1];
                      if (oldestNotification) {
                        const oldestDate = new Date(oldestNotification._createdAt);
                        const daysOld = Math.floor((new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
                        return ` • Oldest: ${daysOld}d ago`;
                      }
                      return '';
                    })()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.isRead ? 'bg-white' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {notification.sender?.image ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={notification.sender.image} />
                              <AvatarFallback>
                                {notification.sender.name?.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <div className="text-sm text-gray-600 mt-1">
                                <p>
                                  {notification.sender?.name && (
                                    <span className="font-medium text-gray-900">
                                      {notification.sender.name}
                                    </span>
                                  )}
                                  {' '}{notification.message}
                                  {notification.startup?.title && (
                                    <span className="font-medium text-gray-900">
                                      {' '}{notification.startup.title}
                                    </span>
                                  )}
                                </p>
                                {notification.type === 'reply' && notification.metadata?.parentCommentText && (
                                  <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                    <span className="font-medium">Replying to:</span> "{notification.metadata.parentCommentText}"
                                  </div>
                                )}
                                                                 {notification.type === 'comment_like' && notification.metadata?.commentText && (
                                   <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                     <span className="font-medium">Comment:</span> "{notification.metadata.commentText}"
                                   </div>
                                 )}
                                 {notification.type === 'report' && (
                                   <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                     <div className="space-y-1">
                                       {notification.metadata?.reportReason && (
                                         <div><span className="font-medium">Reason:</span> {notification.metadata.reportReason}</div>
                                       )}
                                       {notification.metadata?.actionTaken && (
                                         <div><span className="font-medium">Action:</span> {notification.metadata.actionTaken}</div>
                                       )}
                                     </div>
                                   </div>
                                 )}
                                 {notification.type === 'interested_submission' && notification.interestedSubmission && (
                                   <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                     <div className="space-y-1">
                                       <div><span className="font-medium">User:</span> {notification.interestedSubmission.name}</div>
                                       <div><span className="font-medium">Email:</span> {notification.interestedSubmission.email}</div>
                                     </div>
                                   </div>
                                 )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimestamp(notification._createdAt)}
                              </p>
                            </div>
                            
                            {!notification.isRead && (
                              <div className="flex-shrink-0 ml-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {notifications.length > 0 
                  ? (notifications.length > displayNotifications.length 
                      ? `Show All (${notifications.length})` 
                      : 'View All Notifications')
                  : 'View All Notifications'
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell; 