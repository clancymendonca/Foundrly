'use client';

import { useCallback } from 'react';
import { UnifiedPushNotificationService } from '@/lib/notifications/unifiedPushNotifications';

interface NotificationData {
  type: 'like' | 'dislike' | 'comment' | 'reply' | 'interested' | 'follow';
  title: string;
  message: string;
  metadata?: any;
}

export function useClientNotifications() {
  
  const showNotification = useCallback(async (notification: NotificationData) => {
    try {
      console.log('🔔 useClientNotifications.showNotification called:', notification);
      console.log('🔍 Notification support check:', {
        isSupported: UnifiedPushNotificationService.isSupported(),
        permissionStatus: UnifiedPushNotificationService.getPermissionStatus()
      });
      
      // Check if notifications are supported and permission is granted
      if (!UnifiedPushNotificationService.isSupported()) {
        console.warn('❌ Notifications not supported in this browser');
        return false;
      }

      if (UnifiedPushNotificationService.getPermissionStatus() !== 'granted') {
        console.warn('❌ Notification permission not granted:', UnifiedPushNotificationService.getPermissionStatus());
        return false;
      }

      // Show the notification
      const result = await UnifiedPushNotificationService.sendNotification({
        type: notification.type,
        recipientId: 'current-user', // This will be the current user
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata
      });

      return result;
    } catch (error) {
      console.error('Failed to show client notification:', error);
      return false;
    }
  }, []);

  const showLikeNotification = useCallback((startupTitle: string, likerName: string) => {
    console.log('🔔 useClientNotifications.showLikeNotification called:', { startupTitle, likerName });
    return showNotification({
      type: 'like',
      title: 'New Like',
      message: `${likerName} liked your startup "${startupTitle}"`,
      metadata: { startupTitle, likerName }
    });
  }, [showNotification]);

  const showDislikeNotification = useCallback((startupTitle: string, dislikerName: string) => {
    return showNotification({
      type: 'dislike',
      title: 'New Dislike',
      message: `${dislikerName} disliked your startup "${startupTitle}"`,
      metadata: { startupTitle, dislikerName }
    });
  }, [showNotification]);

  const showCommentNotification = useCallback((startupTitle: string, commenterName: string, commentText: string) => {
    return showNotification({
      type: 'comment',
      title: 'New Comment',
      message: `${commenterName} commented on your startup "${startupTitle}"`,
      metadata: { startupTitle, commenterName, commentText }
    });
  }, [showNotification]);

  const showReplyNotification = useCallback((startupTitle: string, replierName: string, replyText: string) => {
    return showNotification({
      type: 'reply',
      title: 'New Reply',
      message: `${replierName} replied to your comment on "${startupTitle}"`,
      metadata: { startupTitle, replierName, replyText }
    });
  }, [showNotification]);

  const showInterestedNotification = useCallback((startupTitle: string, interestedUserName: string) => {
    return showNotification({
      type: 'interested',
      title: 'New Interest',
      message: `${interestedUserName} is interested in your startup "${startupTitle}"`,
      metadata: { startupTitle, interestedUserName }
    });
  }, [showNotification]);

  const showFollowNotification = useCallback((followerName: string) => {
    return showNotification({
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`,
      metadata: { followerName }
    });
  }, [showNotification]);

  return {
    showNotification,
    showLikeNotification,
    showDislikeNotification,
    showCommentNotification,
    showReplyNotification,
    showInterestedNotification,
    showFollowNotification
  };
}
