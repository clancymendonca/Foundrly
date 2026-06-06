import { StreamChat } from 'stream-chat';
import { getMessaging, getToken, deleteToken, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

// Lightweight Firebase client init to obtain FCM web token
function ensureFirebaseApp() {
  if (getApps().length) return;
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  } as any;
  initializeApp(cfg);
}

async function getFcmMessaging(): Promise<Messaging | null> {
  try {
    // Some Chrome setups inaccurately report unsupported; attempt anyway
    ensureFirebaseApp();
    return getMessaging();
  } catch {
    return null;
  }
}

// Interface for Stream Chat push notification data
export interface StreamChatPushData {
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
}

// Stream Chat Push Notification Service
export class StreamChatPushService {
  private static instance: StreamChatPushService;
  public chatClient: StreamChat | null = null;

  static getInstance(): StreamChatPushService {
    if (!StreamChatPushService.instance) {
      StreamChatPushService.instance = new StreamChatPushService();
    }
    return StreamChatPushService.instance;
  }

  // Initialize Stream Chat client
  async initialize(apiKey: string, userId: string, token: string): Promise<void> {
    try {
      this.chatClient = StreamChat.getInstance(apiKey);
      await this.chatClient.connectUser({ id: userId }, token);
      console.log('✅ Stream Chat client initialized for push notifications');
    } catch (error) {
      console.error('❌ Failed to initialize Stream Chat client:', error);
      throw error;
    }
  }

  // Set an existing Stream Chat client (alternative to initialize)
  setChatClient(chatClient: StreamChat): void {
    this.chatClient = chatClient;
    console.log('✅ Stream Chat client set for push notifications');
  }

  // Check if the service is ready for use
  isReady(): boolean {
    return this.chatClient !== null && 
           this.chatClient.userID !== undefined && 
           !this.chatClient.disconnected;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Request permission for push notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }
    
    const permission = await Notification.requestPermission();
    return permission;
  }

  // Register for push notifications with Stream Chat
  async registerForPushNotifications(): Promise<boolean> {
    if (!this.chatClient) {
      throw new Error('Stream Chat client not initialized');
    }

    // Validate client state before proceeding
    const validateClient = () => {
      if (!this.chatClient?.userID) {
        throw new Error('Stream Chat client not connected to a user');
      }
      if (this.chatClient.disconnected) {
        throw new Error('Stream Chat client is disconnected');
      }
    };

    // Validate before starting
    validateClient();

    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    try {
      // Re-validate before critical operations
      validateClient();

      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register (or ensure) service worker for Firebase messaging and use it for token
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service worker registered for Firebase messaging');

      // Obtain FCM token for this browser
      const messaging = await getFcmMessaging();
      if (!messaging) {
        throw new Error('FCM not supported in this browser');
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
      }

      const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
      if (!fcmToken) {
        throw new Error('Failed to obtain FCM token');
      }

      // Register device with Stream using your named Firebase provider ("foundrly").
      // Different SDK versions support different signatures; try common ones.
      try {
        await (this.chatClient as any).addDevice(fcmToken, 'firebase', 'foundrly');
      } catch (e1) {
        try {
          await (this.chatClient as any).addDevice(fcmToken, 'firebase', undefined, 'foundrly');
        } catch (e2) {
          // Last resort: object form is not accepted in current SDK for id, so rethrow first error
          throw e1;
        }
      }

      // Skip updateUser here to avoid "User ID is required" errors on some clients.
      // Device registration is sufficient for push delivery.

      console.log('✅ Successfully registered for Stream Chat push notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to register for Stream Chat push notifications:', error);
      throw error;
    }
  }

  // Unregister from push notifications
  async unregisterFromPushNotifications(): Promise<boolean> {
    if (!this.chatClient) {
      throw new Error('Stream Chat client not initialized');
    }

    if (!this.chatClient.userID) {
      throw new Error('Stream Chat client not connected to a user');
    }

    // Additional safety check - ensure client is still connected
    if (this.chatClient.disconnected) {
      throw new Error('Stream Chat client is disconnected');
    }

    try {
      // Remove FCM token from Stream and delete local token
      const messaging = await getFcmMessaging();
      if (messaging) {
        try {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          const token = await getToken(messaging, { vapidKey });
          if (token) {
            try {
              await (this.chatClient as any).removeDevice(token, 'foundrly');
            } catch (e1) {
              try {
                await (this.chatClient as any).removeDevice(token);
              } catch {
                // best effort
              }
            }
            await deleteToken(messaging);
          }
        } catch {}
      }

      // Also disable push in Stream user settings (best-effort)
      await this.chatClient.updateUser({
        id: this.chatClient.userID,
        pushNotificationSettings: {
          push: {
            enabled: false,
            pushNotificationChannels: [],
            pushNotificationChannelsEnabled: []
          }
        }
      });

      console.log('✅ Successfully unregistered from Stream Chat push notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister from Stream Chat push notifications:', error);
      throw error;
    }
  }

  // Send push notification through Stream Chat
  async sendPushNotification(channelId: string, message: string, userId: string): Promise<boolean> {
    if (!this.chatClient) {
      throw new Error('Stream Chat client not initialized');
    }

    if (!this.chatClient.userID) {
      throw new Error('Stream Chat client not connected to a user');
    }

    try {
      // Get or create the channel
      const channel = this.chatClient.channel('messaging', channelId, {
        members: [userId]
      });
      
      // Ensure the channel is initialized
      await channel.watch();
      
      // Send a message that will trigger push notifications
      await channel.sendMessage({
        text: message,
        user_id: userId,
        type: 'regular'
      });

      console.log('✅ Push notification sent through Stream Chat');
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification through Stream Chat:', error);
      throw error;
    }
  }

  // Get current push notification settings
  async getPushNotificationSettings(): Promise<any> {
    if (!this.chatClient) {
      throw new Error('Stream Chat client not initialized');
    }

    if (!this.chatClient.userID) {
      throw new Error('Stream Chat client not connected to a user');
    }

    try {
      // Get current user's push notification settings
      const user = this.chatClient.user;
      if (!user) {
        throw new Error('User not connected to Stream Chat');
      }
      
      return user.pushNotificationSettings || {
        push: {
          enabled: false,
          pushNotificationChannels: [],
          pushNotificationChannelsEnabled: []
        }
      };
    } catch (error) {
      console.error('❌ Failed to get push notification settings:', error);
      return {
        push: {
          enabled: false,
          pushNotificationChannels: [],
          pushNotificationChannelsEnabled: []
        }
      };
    }
  }

  // Update push notification settings
  async updatePushNotificationSettings(settings: any): Promise<boolean> {
    if (!this.chatClient) {
      throw new Error('Stream Chat client not initialized');
    }

    if (!this.chatClient.userID) {
      throw new Error('Stream Chat client not connected to a user');
    }

    try {
      await this.chatClient.updateUser({
        id: this.chatClient.userID,
        pushNotificationSettings: settings
      });
      console.log('✅ Push notification settings updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update push notification settings:', error);
      throw error;
    }
  }

  // Disconnect Stream Chat client
  async disconnect(): Promise<void> {
    if (this.chatClient) {
      await this.chatClient.disconnectUser();
      this.chatClient = null;
      console.log('✅ Stream Chat client disconnected');
    }
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const streamChatPushService = StreamChatPushService.getInstance();
