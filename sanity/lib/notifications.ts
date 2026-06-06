import { client } from './client';
import { writeClient } from './write-client';
import { Notification } from '@/components/notifications/NotificationBell';
import { sendCriticalNotificationEmail } from '@/lib/notifications/emailNotifications';
import { sendPushNotification } from '@/lib/notifications/pushNotifications';

export interface CreateNotificationData {
  recipientId: string;
  type: 'follow' | 'comment' | 'reply' | 'like' | 'comment_like' | 'report' | 'system' | 'mention';
  title: string;
  message: string;
  senderId?: string;
  startupId?: string;
  commentId?: string;
  actionUrl?: string;
  metadata?: {
    startupTitle?: string;
    commentText?: string;
    userName?: string;
    userImage?: string;
    parentCommentText?: string;
    reportReason?: string;
    reportStatus?: string;
    actionTaken?: string;
  };
}

export interface SanityNotification {
  _id: string;
  _type: 'notification';
  _createdAt: string;
  _updatedAt: string;
  recipient: {
    _ref: string;
    _type: 'reference';
  };
  type: string;
  title: string;
  message: string;
  sender?: {
    _ref: string;
    _type: 'reference';
  };
  startup?: {
    _ref: string;
    _type: 'reference';
  };
  comment?: {
    _ref: string;
    _type: 'reference';
  };
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: {
    startupTitle?: string;
    commentText?: string;
    userName?: string;
    userImage?: string;
    parentCommentText?: string;
    reportReason?: string;
    reportStatus?: string;
    actionTaken?: string;
  };
}

/**
 * Create a new notification in Sanity
 */
export async function createNotification(data: CreateNotificationData): Promise<string> {
  try {
    console.log('🔔 createNotification called with data:', data);
    
    const notificationDoc = {
      _type: 'notification',
      recipient: {
        _type: 'reference',
        _ref: data.recipientId
      },
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      ...(data.senderId && {
        sender: {
          _type: 'reference',
          _ref: data.senderId
        }
      }),
      ...(data.startupId && {
        startup: {
          _type: 'reference',
          _ref: data.startupId
        }
      }),
      ...(data.commentId && {
        comment: {
          _type: 'reference',
          _ref: data.commentId
        }
      }),
      ...(data.interestedSubmissionId && { interestedSubmissionId: data.interestedSubmissionId }),
      ...(data.actionUrl && { actionUrl: data.actionUrl }),
      ...(data.metadata && { metadata: data.metadata })
    };

    console.log('🔔 Notification document to create:', notificationDoc);
    console.log('🔔 Using writeClient:', !!writeClient);

    const result = await writeClient.create(notificationDoc);
    console.log('✅ Notification created successfully:', result);
    
    // Send email for critical notifications
    try {
      await sendCriticalNotificationEmail({
        type: data.type,
        recipientId: data.recipientId,
        metadata: data.metadata,
        title: data.title,
        message: data.message
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send email notification (non-critical):', emailError);
      // Don't fail the notification creation if email fails
    }

    // Send push notification
    try {
      await sendPushNotification({
        type: data.type,
        recipientId: data.recipientId,
        title: data.title,
        message: data.message,
        metadata: data.metadata
      });
    } catch (pushError) {
      console.error('⚠️ Failed to send push notification (non-critical):', pushError);
      // Don't fail the notification creation if push notification fails
    }
    
    return result._id;
  } catch (error) {
    console.error('❌ Error creating notification:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Failed to create notification: ${error.message}`);
  }
}

/**
 * Get notifications for a specific user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ notifications: SanityNotification[]; total: number }> {
  try {
    console.log('🔔 getUserNotifications called with:', { userId, limit, offset });
    
    if (!userId) {
      throw new Error('userId is required');
    }

    // Get total count
    const totalQuery = `count(*[_type == "notification" && recipient._ref == $userId])`;
    console.log('🔔 Executing total query:', totalQuery);
    
    const total = await client.fetch(totalQuery, { userId });
    console.log('🔔 Total count result:', total);

    // Get notifications with pagination
    const notificationsQuery = `
      *[_type == "notification" && recipient._ref == $userId] | order(_createdAt desc) [$offset...$limit] {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        recipient,
        type,
        title,
        message,
        sender,
        startup,
        comment,
        actionUrl,
        isRead,
        readAt,
        metadata
      }
    `;
    
    console.log('🔔 Executing notifications query with params:', { userId, limit: offset + limit, offset });
    const notifications = await client.fetch(notificationsQuery, {
      userId,
      limit: offset + limit,
      offset
    });

    console.log('🔔 Raw notifications from Sanity:', { count: notifications?.length, notifications });
    
    // Log each notification type for debugging
    if (notifications && notifications.length > 0) {
      notifications.forEach((notification: any, index: number) => {
        console.log(`🔔 Notification ${index + 1}:`, {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          hasMetadata: !!notification.metadata,
          metadataKeys: notification.metadata ? Object.keys(notification.metadata) : 'none'
        });
      });
    }

    return { notifications: notifications || [], total: total || 0 };
  } catch (error) {
    console.error('❌ Error fetching user notifications:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
      limit,
      offset
    });
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    console.log('getUnreadNotificationsCount called with userId:', userId);
    
    if (!userId) {
      console.warn('getUnreadNotificationsCount: userId is empty, returning 0');
      return 0;
    }

    const query = `count(*[_type == "notification" && recipient._ref == $userId && isRead == false])`;
    console.log('Executing unread count query:', query);
    
    const result = await client.fetch(query, { userId });
    console.log('Unread count result:', result);
    
    return result || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId
    });
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await writeClient.patch(notificationId).set({
      isRead: true,
      readAt: new Date().toISOString()
    }).commit();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const query = `*[_type == "notification" && recipient._ref == $userId && isRead == false]._id`;
    const notificationIds = await client.fetch(query, { userId });
    
    if (notificationIds.length > 0) {
      const patches = notificationIds.map((id: string) =>
        writeClient.patch(id).set({
          isRead: true,
          readAt: new Date().toISOString()
        })
      );
      
      await Promise.all(patches.map(patch => patch.commit()));
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

/**
 * Delete old notifications (cleanup function)
 */
export async function deleteOldNotifications(olderThanDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const query = `*[_type == "notification" && _createdAt < $cutoffDate && isRead == true]._id`;
    const notificationIds = await client.fetch(query, { 
      cutoffDate: cutoffDate.toISOString() 
    });
    
    if (notificationIds.length > 0) {
      await Promise.all(
        notificationIds.map((id: string) => writeClient.delete(id))
      );
    }
    
    return notificationIds.length;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return 0;
  }
}

/**
 * Convert Sanity notification to frontend notification format
 */
export function convertSanityNotificationToFrontend(
  sanityNotification: SanityNotification
): Notification {
  console.log('🔄 Converting Sanity notification to frontend format:', {
    id: sanityNotification._id,
    type: sanityNotification.type,
    title: sanityNotification.title,
    message: sanityNotification.message,
    hasSender: !!sanityNotification.sender,
    hasStartup: !!sanityNotification.startup,
    hasComment: !!sanityNotification.comment,
    hasMetadata: !!sanityNotification.metadata,
    metadataKeys: sanityNotification.metadata ? Object.keys(sanityNotification.metadata) : 'none'
  });

  const converted = {
    id: sanityNotification._id,
    type: sanityNotification.type as any,
    title: sanityNotification.title,
    message: sanityNotification.message,
    userId: sanityNotification.sender?._ref,
    userName: sanityNotification.metadata?.userName,
    userImage: sanityNotification.metadata?.userImage,
    startupId: sanityNotification.startup?._ref,
    startupTitle: sanityNotification.metadata?.startupTitle,
    commentId: sanityNotification.comment?._ref,
    timestamp: sanityNotification._createdAt,
    isRead: sanityNotification.isRead,
    actionUrl: sanityNotification.actionUrl,
    metadata: sanityNotification.metadata
  };

  console.log('🔄 Converted notification:', converted);
  return converted;
}

/**
 * Create follow notification
 */
export async function createFollowNotification(
  followerId: string,
  followedId: string,
  followerName: string,
  followerImage?: string
): Promise<string> {
  return createNotification({
    recipientId: followedId,
    type: 'follow',
    title: 'New Follower',
    message: 'started following you',
    senderId: followerId,
    actionUrl: `/user/${followerId}`,
    metadata: {
      userName: followerName,
      userImage: followerImage
    }
  });
}

/**
 * Create comment notification
 */
export async function createCommentNotification(
  commenterId: string,
  startupOwnerId: string,
  startupId: string,
  startupTitle: string,
  commenterName: string,
  commenterImage?: string,
  commentText?: string
): Promise<string> {
  return createNotification({
    recipientId: startupOwnerId,
    type: 'comment',
    title: 'New Comment',
    message: 'commented on your startup',
    senderId: commenterId,
    startupId,
    actionUrl: `/startup/${startupId}`,
    metadata: {
      startupTitle,
      commentText,
      userName: commenterName,
      userImage: commenterImage
    }
  });
}

/**
 * Create reply notification
 */
export async function createReplyNotification(
  replierId: string,
  commentAuthorId: string,
  startupId: string,
  startupTitle: string,
  replierName: string,
  replierImage?: string,
  replyText?: string,
  parentCommentText?: string
): Promise<string> {
  return createNotification({
    recipientId: commentAuthorId,
    type: 'reply',
    title: 'New Reply',
    message: 'replied to your comment',
    senderId: replierId,
    startupId,
    actionUrl: `/startup/${startupId}`,
    metadata: {
      startupTitle,
      commentText: replyText,
      userName: replierName,
      userImage: replierImage,
      parentCommentText
    }
  });
}

/**
 * Create like notification
 */
export async function createLikeNotification(
  likerId: string,
  startupOwnerId: string,
  startupId: string,
  startupTitle: string,
  likerName: string,
  likerImage?: string
): Promise<string> {
  return createNotification({
    recipientId: startupOwnerId,
    type: 'like',
    title: 'New Like',
    message: 'liked your startup',
    senderId: likerId,
    startupId,
    actionUrl: `/startup/${startupId}`,
    metadata: {
      startupTitle,
      userName: likerName,
      userImage: likerImage
    }
  });
}

/**
 * Create comment like notification
 */
export async function createCommentLikeNotification(
  likerId: string,
  commentAuthorId: string,
  commentId: string,
  commentText: string,
  startupId: string,
  startupTitle: string,
  likerName: string,
  likerImage?: string
): Promise<string> {
  return createNotification({
    recipientId: commentAuthorId,
    type: 'comment_like',
    title: 'Comment Liked',
    message: 'liked your comment',
    senderId: likerId,
    startupId,
    commentId,
    actionUrl: `/startup/${startupId}`,
    metadata: {
      startupTitle,
      commentText,
      userName: likerName,
      userImage: likerImage
    }
  });
}

/**
 * Create interested submission notification
 */
export async function createInterestedSubmissionNotification(
  interestedUserId: string,
  startupOwnerId: string,
  startupId: string,
  startupTitle: string,
  interestedUserName: string,
  interestedUserEmail: string,
  interestedSubmissionId: string,
  message: string,
  interestedUserImage?: string,
  additionalData?: {
    phone?: string;
    company?: string;
    role?: string;
    investmentAmount?: string;
    investmentType?: string;
    timeline?: string;
    preferredContact?: string;
    linkedin?: string;
    website?: string;
    experience?: string;
    howDidYouHear?: string;
  }
): Promise<string> {
  return createNotification({
    recipientId: startupOwnerId,
    type: 'interested_submission',
    title: 'New Interest in Your Startup',
    message: `submitted interest in your startup "${startupTitle}"`,
    senderId: interestedUserId,
    startupId,
    interestedSubmissionId,
    actionUrl: `/interested`,
    metadata: {
      startupTitle,
      userName: interestedUserName,
      userEmail: interestedUserEmail,
      userImage: interestedUserImage,
      message,
      ...additionalData
    }
  });
}
