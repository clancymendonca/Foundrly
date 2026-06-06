// Server-side push notification service
// This runs on the server and sends notifications to users

export interface ServerPushNotification {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: any;
}

// Server-side push notification service
export class ServerPushNotificationService {
  
  // Send push notification from server-side
  static async sendNotification(notification: ServerPushNotification): Promise<boolean> {
    try {
      console.log(`🔔 Server sending ${notification.type} notification to user ${notification.recipientId}`);
      console.log(`📝 Title: ${notification.title}`);
      console.log(`📝 Message: ${notification.message}`);
      
      // Store notification in database for real-time delivery
      const { createNotification } = await import('@/sanity/lib/notifications');
      
      try {
        await createNotification({
          recipientId: notification.recipientId,
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          senderId: notification.metadata?.likerId || notification.metadata?.dislikerId || notification.metadata?.commenterId,
          startupId: notification.metadata?.startupId,
          actionUrl: notification.metadata?.startupId ? `/startup/${notification.metadata.startupId}` : undefined,
          metadata: notification.metadata
        });
        
        console.log(`✅ ${notification.type} notification stored in database for user ${notification.recipientId}`);
        
        // Send real-time notification
        try {
          const { sendRealtimeNotification } = await import('@/lib/notifications/realtimeNotifications');
          await sendRealtimeNotification({
            type: notification.type,
            recipientId: notification.recipientId,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata
          });
          console.log(`✅ Real-time notification sent to user ${notification.recipientId}`);
        } catch (realtimeError) {
          console.error('❌ Failed to send real-time notification:', realtimeError);
          // Don't fail the entire request if real-time delivery fails
        }
        
        // TODO: In a production environment, you would also:
        // 1. Send email notification if user has email notifications enabled
        // 2. Send mobile push notification if user has mobile app
        
        return true;
        
      } catch (dbError) {
        console.error('❌ Failed to store notification in database:', dbError);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Failed to send server push notification:', error);
      return false;
    }
  }

  // Send notification to multiple users
  static async sendBulkNotification(notifications: ServerPushNotification[]): Promise<boolean> {
    try {
      console.log(`🔔 Server sending ${notifications.length} bulk notifications`);
      
      const results = await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      );
      
      const successCount = results.filter(result => result).length;
      console.log(`✅ ${successCount}/${notifications.length} notifications sent successfully`);
      
      return successCount === notifications.length;
      
    } catch (error) {
      console.error('❌ Failed to send bulk notifications:', error);
      return false;
    }
  }
}

// Helper function for backward compatibility
export async function sendServerPushNotification(notification: ServerPushNotification): Promise<boolean> {
  return ServerPushNotificationService.sendNotification(notification);
}
