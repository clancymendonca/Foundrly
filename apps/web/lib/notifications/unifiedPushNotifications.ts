import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
function ensureFirebaseApp() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
}

async function getFcmMessaging(): Promise<Messaging | null> {
  try {
    ensureFirebaseApp();
    return getMessaging();
  } catch (error) {
    console.error('Failed to get FCM messaging:', error);
    return null;
  }
}

// Unified push notification service using Firebase
export class UnifiedPushNotificationService {
  private static activeNotifications = new Set<Notification>();
  private static notificationCount = 0;
  
  // Detect if device is mobile
  private static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // Detect if device is iOS
  private static isIOSDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }
  
  // Send push notification using Firebase
  static async sendNotification(notification: {
    type: string;
    recipientId: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      console.log('🔔 Attempting to send notification:', notification.type);
      console.log('🔍 Notification permission status:', Notification.permission);
      console.log('🔍 Notification support:', 'Notification' in window);
      
      // Check if notifications are supported and permission is granted
      if (!('Notification' in window)) {
        console.error('❌ This browser does not support notifications');
        return false;
      }

      if (Notification.permission !== 'granted') {
        console.warn('❌ Notification permission not granted:', Notification.permission);
        return false;
      }

      // Check user notification preferences
      if (!this.shouldShowNotification(notification.type)) {
        console.log('🔕 Notification blocked by user preferences:', notification.type);
        return false;
      }

      // Check if we can send more notifications
      if (!this.canSendNotification()) {
        console.warn('❌ Cannot send notification due to browser limits');
        return false;
      }

      // Create unique tag to prevent notification blocking
      const uniqueTag = `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Mobile-specific notification options
      const isMobile = this.isMobileDevice();
      const isIOS = this.isIOSDevice();
      
      const notificationOptions = {
        title: notification.title,
        body: notification.message,
        icon: `/icons/${notification.type}.svg`,
        tag: uniqueTag, // Use unique tag to prevent blocking
        data: { type: notification.type, ...notification.metadata },
        requireInteraction: isMobile, // Keep notifications visible longer on mobile
        silent: false,
        timestamp: Date.now(),
        vibrate: isMobile ? [200, 100, 200] : undefined, // Only vibrate on mobile
        // iOS-specific options
        ...(isIOS && {
          renotify: true
        })
      };

      console.log('🔔 Creating notification with options:', notificationOptions);

      // Create the notification
      const notificationInstance = new Notification(notification.title, notificationOptions);
      
      // Track active notifications
      this.activeNotifications.add(notificationInstance);
      this.notificationCount++;
      
      // Add event listeners for debugging
      notificationInstance.onclick = () => {
        console.log('🔔 Notification clicked:', notification.type);
        window.focus(); // Focus the window when notification is clicked
        this.removeNotification(notificationInstance);
      };

      notificationInstance.onerror = (error) => {
        console.error('❌ Notification error:', error);
        this.removeNotification(notificationInstance);
      };

      notificationInstance.onshow = () => {
        console.log('✅ Notification shown:', notification.type);
      };

      notificationInstance.onclose = () => {
        console.log('🔔 Notification closed:', notification.type);
        this.removeNotification(notificationInstance);
      };

      // Auto-close after 5 seconds for faster response
      setTimeout(() => {
        this.removeNotification(notificationInstance);
      }, 5000);

      console.log(`✅ ${notification.type} notification created successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.error('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Remove notification from tracking
  private static removeNotification(notification: Notification) {
    try {
      this.activeNotifications.delete(notification);
      notification.close();
    } catch (e) {
      // Notification might already be closed
    }
  }

  // Clear all active notifications
  static clearAllNotifications() {
    console.log(`🧹 Clearing ${this.activeNotifications.size} active notifications`);
    this.activeNotifications.forEach(notification => {
      try {
        notification.close();
      } catch (e) {
        // Notification might already be closed
      }
    });
    this.activeNotifications.clear();
    this.notificationCount = 0;
  }

  // Get notification statistics
  static getNotificationStats() {
    return {
      activeCount: this.activeNotifications.size,
      totalSent: this.notificationCount,
      permissionStatus: this.getPermissionStatus()
    };
  }

  // Check if notification should be shown based on user preferences
  private static shouldShowNotification(type: string): boolean {
    try {
      // Check if notifications are globally enabled
      const notificationsEnabled = typeof window !== 'undefined' 
        ? window.localStorage.getItem('notifications_enabled') !== 'false'
        : true;
      
      if (!notificationsEnabled) {
        console.log('🔕 Notifications globally disabled');
        return false;
      }

      // Check type-specific preferences
      const typePrefs = typeof window !== 'undefined' 
        ? window.localStorage.getItem('notification_types_enabled')
        : null;
      
      if (typePrefs) {
        try {
          const parsed = JSON.parse(typePrefs);
          if (parsed && typeof parsed === 'object' && parsed[type] === false) {
            console.log('🔕 Notification type disabled:', type);
            return false;
          }
        } catch (error) {
          console.warn('Failed to parse notification type preferences:', error);
        }
      }

      return true;
    } catch (error) {
      console.warn('Error checking notification preferences:', error);
      return true; // Default to showing notifications if there's an error
    }
  }

  // Check if we can send more notifications (browser limits)
  static canSendNotification(): boolean {
    // Some browsers limit the number of notifications
    if (this.activeNotifications.size >= 5) {
      console.warn('⚠️ Too many active notifications, clearing old ones');
      this.clearAllNotifications();
    }
    return true;
  }
}

// Helper function for backward compatibility
export async function sendPushNotification(notification: {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: any;
}): Promise<boolean> {
  return UnifiedPushNotificationService.sendNotification(notification);
}
