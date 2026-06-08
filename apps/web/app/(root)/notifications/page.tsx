"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Filter, Check, X, UserPlus, MessageSquare, Heart, Eye, AlertCircle, Loader2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
interface Notification {
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
import { useNotifications } from '@/hooks/notifications/useNotifications';

const NotificationsPage = () => {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<'all' | 'unread' | 'follow' | 'comment' | 'reply' | 'like' | 'report' | 'interested_submission'>('all');
  const { 
    notifications, 
    unreadCount, 
    loading, 
    pagination,
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-teal-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment_like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'report':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'mention':
        return <MessageSquare className="w-5 h-5 text-orange-500" />;
      case 'interested_submission':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'comment') return notification.type === 'comment' || notification.type === 'comment_like' || notification.type === 'reply';
    return notification.type === filter;
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    // Navigate to interested page for interested submission notifications
    if (notification.type === 'interested_submission') {
      window.location.href = '/interested';
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleLoadMore = async () => {
    if (pagination?.hasMore && !loading) {
      await refreshNotifications();
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view notifications</h1>
          <p className="text-gray-600">You need to be logged in to access your notifications.</p>
        </div>
      </div>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-gray-600">Stay updated with all your activity on Foundrly</p>
        </div>


        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex flex-wrap gap-2">
                                 {[
                   { key: 'all', label: 'All' },
                   { key: 'unread', label: 'Unread' },
                   { key: 'follow', label: 'Follows' },
                   { key: 'comment', label: 'Comments' },
                   { key: 'like', label: 'Likes' },
                   { key: 'interested_submission', label: 'Interested Users' },
                   { key: 'report', label: 'Reports & Moderation' }
                 ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                                 {filter === 'all' 
                   ? "You're all caught up! Check back later for new notifications."
                   : filter === 'comment'
                   ? "No comment, reply, or comment like notifications found."
                   : `No ${filter} notifications found.`
                 }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'bg-white' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {notification.sender?.image ? (
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={notification.sender.image} />
                          <AvatarFallback>
                            {notification.sender.name?.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          
                                                     <div className="text-gray-700 mb-3">
                             <p>
                               {notification.sender?.name && (
                                 <span className="font-semibold text-gray-900">
                                   {notification.sender.name}
                                 </span>
                               )}
                               {' '}{notification.message}
                               {notification.startup?.title && (
                                 <span className="font-semibold text-gray-900">
                                   {' '}{notification.startup.title}
                                 </span>
                               )}
                             </p>
                           </div>
                           
                           {notification.type === 'reply' && notification.metadata?.parentCommentText && (
                             <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-teal-500">
                               <p className="text-sm text-gray-700">
                                 <span className="font-medium text-teal-700">Replying to:</span>
                                 <span className="ml-2 italic">"{notification.metadata.parentCommentText}"</span>
                               </p>
                             </div>
                           )}
                                                                                  {notification.type === 'comment_like' && notification.metadata?.commentText && (
                              <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-pink-500">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium text-pink-700">Comment:</span>
                                  <span className="ml-2 italic">"{notification.metadata.commentText}"</span>
                                </p>
                              </div>
                            )}
                            {notification.type === 'report' && (
                              <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-orange-500">
                                <div className="text-sm text-gray-700 space-y-1">
                                  {notification.metadata?.reportReason && (
                                    <p>
                                      <span className="font-medium text-orange-700">Reason:</span>
                                      <span className="ml-2">{notification.metadata.reportReason}</span>
                                    </p>
                                  )}
                                  {notification.metadata?.reportStatus && (
                                    <p>
                                      <span className="font-medium text-orange-700">Status:</span>
                                      <span className="ml-2">{notification.metadata.reportStatus}</span>
                                    </p>
                                  )}
                                  {notification.metadata?.actionTaken && (
                                    <p>
                                      <span className="font-medium text-orange-700">Action:</span>
                                      <span className="ml-2">{notification.metadata.actionTaken}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {notification.type === 'interested_submission' && notification.interestedSubmission && (
                              <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-purple-500">
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p>
                                    <span className="font-medium text-purple-700">Interested User:</span>
                                    <span className="ml-2">{notification.interestedSubmission.name}</span>
                                  </p>
                                  <p>
                                    <span className="font-medium text-purple-700">Email:</span>
                                    <span className="ml-2">{notification.interestedSubmission.email}</span>
                                  </p>
                                </div>
                              </div>
                            )}
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              {formatTimestamp(notification._createdAt)}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Mark as read
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleNotificationClick(notification)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                {notification.type === 'interested_submission' ? 'View Details' : 'View'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {pagination?.hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                'Load More Notifications'
              )}
            </button>
          </div>
        )}

        {/* Summary */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredNotifications.length} of {pagination?.total || 0} notifications
                         {filter !== 'all' && filter === 'comment' && ' (filtered by comments, replies & comment likes)'}
             {filter !== 'all' && filter !== 'comment' && ` (filtered by ${filter})`}
            {pagination?.hasMore && ' • Scroll up to load more'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 