import { client } from '@/sanity/lib/client';

// Interface for push notification data
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

// Interface for user subscription
export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

// Push notification service
export class PushNotificationService {
  
  // Check if push notifications are supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Request permission for push notifications
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe user to push notifications
  static async subscribeUser(userId: string): Promise<PushSubscription | null> {
    try {
      console.log('🔧 Starting push notification subscription for user:', userId);
      
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported');
      }
      console.log('✅ Push notifications are supported');

      console.log('🔐 Requesting notification permission...');
      const permission = await this.requestPermission();
      console.log('✅ Permission result:', permission);
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      console.log('🔧 Registering service worker...');
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered:', registration);
      
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      console.log('🔑 Getting VAPID public key...');
      // Subscribe to push manager
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }
      console.log('✅ VAPID public key found:', vapidPublicKey.substring(0, 20) + '...');
      
      console.log('🔧 Converting VAPID key...');
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      console.log('✅ VAPID key converted, length:', applicationServerKey.length);
      
      console.log('🔧 Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      console.log('✅ Push subscription created:', subscription);

      // Save subscription to database
      const pushSubscription: PushSubscription = {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0)))),
          auth: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0))))
        },
        createdAt: new Date().toISOString()
      };

      await this.saveSubscription(pushSubscription);
      return pushSubscription;

    } catch (error) {
      console.error('❌ Failed to subscribe user to push notifications:', error);
      return null;
    }
  }

  // Send push notification for specific notification types
  static async sendNotificationPush(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      let pushData: PushNotificationData;

      switch (notification.type) {
        case 'follow':
          pushData = {
            title: 'New Follower',
            body: notification.message,
            icon: '/icons/follow.svg',
            tag: 'follow',
            data: { type: 'follow', ...notification.metadata }
          };
          break;

        case 'comment':
          pushData = {
            title: 'New Comment',
            body: notification.message,
            icon: '/icons/comment.svg',
            tag: 'comment',
            data: { type: 'comment', ...notification.metadata }
          };
          break;

        case 'like':
          pushData = {
            title: 'New Like',
            body: notification.message,
            icon: '/icons/like.svg',
            tag: 'like',
            data: { type: 'like', ...notification.metadata }
          };
          break;

        case 'dislike':
          pushData = {
            title: 'New Dislike',
            body: notification.message,
            icon: '/icons/dislike.svg',
            tag: 'dislike',
            data: { type: 'dislike', ...notification.metadata }
          };
          break;

        case 'interested':
          pushData = {
            title: 'New Interest',
            body: notification.message,
            icon: '/icons/interested.svg',
            tag: 'interested',
            data: { type: 'interested', ...notification.metadata }
          };
          break;

        case 'report':
          pushData = {
            title: 'Moderation Update',
            body: notification.message,
            icon: '/icons/moderation.svg',
            tag: 'moderation',
            data: { type: 'report', ...notification.metadata },
            requireInteraction: true
          };
          break;

        default:
          pushData = {
            title: notification.title,
            body: notification.message,
            icon: '/icons/notification.svg',
            tag: 'general',
            data: { type: notification.type, ...notification.metadata }
          };
      }

      return await this.sendToUser(userId, pushData);

    } catch (error) {
      console.error('❌ Failed to send notification push:', error);
      return false;
    }
  }

  // Send push notification to a specific user
  private static async sendToUser(userId: string, notification: PushNotificationData): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        console.log('⚠️ No push subscription found for user:', userId);
        return false;
      }

      const result = await fetch('/api/push-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification
        }),
      });

      if (!result.ok) {
        throw new Error(`Failed to send push notification: ${result.statusText}`);
      }

      console.log('✅ Push notification sent to user:', userId);
      return true;

    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  // Utility function to convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Use atob from global scope (works in both browser and server)
    let rawData: string;
    try {
      rawData = (typeof window !== 'undefined' ? window.atob : atob)(base64);
    } catch (error) {
      console.error('❌ Error decoding VAPID key:', error);
      throw new Error('Invalid VAPID public key format');
    }
    
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Database operations
  private static async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await client.create({
        _type: 'pushSubscription',
        ...subscription
      });
    } catch (error) {
      console.error('❌ Failed to save push subscription:', error);
      throw error;
    }
  }

  private static async getUserSubscription(userId: string): Promise<PushSubscription | null> {
    try {
      const subscription = await client.fetch(
        `*[_type == "pushSubscription" && userId == $userId][0]`,
        { userId }
      );
      return subscription || null;
    } catch (error) {
      console.error('❌ Failed to get user push subscription:', error);
      return null;
    }
  }
}

// Helper function to send push notification for any notification
export async function sendPushNotification(notification: {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: any;
}): Promise<boolean> {
  try {
    // For now, we'll use a simple approach: send through the API endpoint
    // This will work if the user has subscribed to push notifications
    const response = await fetch('/api/push-notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification: {
          title: notification.title,
          body: notification.message,
          icon: `/icons/${notification.type}.svg`,
          tag: notification.type,
          data: { type: notification.type, ...notification.metadata }
        },
        // We'll need to get the user's subscription from the database
        // For now, this is a placeholder
        subscription: null
      }),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
} 