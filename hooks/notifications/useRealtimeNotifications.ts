'use client';

import React, { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface RealtimeNotification {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: any;
  timestamp: number;
}

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const [lastQueuedCount, setLastQueuedCount] = React.useState(0);

  const clearNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });
      
      if (response.ok) {
        console.log('🧹 Notifications cleared successfully');
      } else {
        console.error('❌ Failed to clear notifications');
      }
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  };

  const handleNotification = useCallback((notification: RealtimeNotification) => {
    console.log('🔔 Received real-time notification:', notification);
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: `/icons/${notification.type}.svg`,
        tag: `realtime-${notification.type}-${notification.timestamp}`,
        data: notification.metadata
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.metadata?.startupId) {
          window.location.href = `/startup/${notification.metadata.startupId}`;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Prevent multiple intervals across components/routes
    if (typeof window !== 'undefined') {
      if ((window as any).__notificationsPollingActive) {
        return;
      }
      (window as any).__notificationsPollingActive = true;
    }

    // Poll for notifications and show them
    const pollForNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/ws');
        if (response.ok) {
          const data = await response.json();
          // Only log when status changes to reduce noise
          const statusKey = `notif_status_${session.user.id}`;
          const prevStatus = typeof window !== 'undefined' ? window.sessionStorage.getItem(statusKey) : null;
          const currentStatus = `${data.connectionCount}|${data.queuedCount}`;
          if (prevStatus !== currentStatus) {
            console.log('📊 Notification service status:', data);
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem(statusKey, currentStatus);
            }
          }
          
          // De-dupe using sessionStorage marker and local count
          const lastHandledKey = `lastHandledQueuedCount_${session.user.id}`;
          const stored = typeof window !== 'undefined' ? Number(sessionStorage.getItem(lastHandledKey) || '0') : 0;
          const effectiveLast = Math.max(lastQueuedCount, stored);

          // Show notification for any new notifications (simple approach)
          if (data.queuedCount > effectiveLast) {
            const newNotifications = data.queuedCount - lastQueuedCount;
            console.log(`🔔 Found ${newNotifications} new notifications (total: ${data.queuedCount})`);
            
            // Show notification for any new notifications
            if ('Notification' in window && Notification.permission === 'granted') {
              // Check if notifications are enabled by user preferences
              const notificationsEnabled = typeof window !== 'undefined' 
                ? window.localStorage.getItem('notifications_enabled') !== 'false'
                : true;
              
              if (!notificationsEnabled) {
                console.log('🔕 Realtime notifications disabled by user preferences');
                return;
              }

              const uniqueTag = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              const notification = new Notification('New Notification!', {
                body: `You have ${newNotifications} new notification${newNotifications > 1 ? 's' : ''}. Check your notification bell!`,
                icon: '/favicon.ico',
                tag: uniqueTag,
                requireInteraction: false,
                silent: false
              });
              
              notification.onshow = () => {
                console.log('✅ Notification shown successfully');
                setLastQueuedCount(data.queuedCount);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(lastHandledKey, String(data.queuedCount));
                }
              };
              
              notification.onerror = (error) => {
                console.error('❌ Notification error:', error);
              };
              
              notification.onclick = () => {
                console.log('🔔 Notification clicked');
                window.focus();
              };

              // Clear server queue once shown to avoid repeats
              clearNotifications().catch(() => {});
            }
          } else {
            // Update the last queued count even if no new notifications
            setLastQueuedCount(data.queuedCount);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(lastHandledKey, String(data.queuedCount));
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to check notification service:', error);
      }
    };

    // Poll every 2 seconds for immediate response
    const interval = setInterval(pollForNotifications, 2000);
    
    // Initial check
    pollForNotifications();

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        (window as any).__notificationsPollingActive = false;
      }
    };
  }, [session?.user?.id]);

  return {
    handleNotification
  };
}
