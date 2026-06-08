'use client';

import React, { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UnifiedPushNotificationService } from '@/lib/notifications/unifiedPushNotifications';

interface RealtimeNotification {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const lastHandledCountRef = React.useRef(0);

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
        console.log('Notifications cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const showQueuedPopups = useCallback(async (notifications: RealtimeNotification[]) => {
    if (!notifications.length) {
      return;
    }

    const notificationsEnabled =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('notifications_enabled') !== 'false'
        : true;

    if (!notificationsEnabled) {
      console.log('Realtime notifications disabled by user preferences');
      return;
    }

    if (
      !UnifiedPushNotificationService.isSupported() ||
      UnifiedPushNotificationService.getPermissionStatus() !== 'granted'
    ) {
      return;
    }

    for (const notification of notifications) {
      await UnifiedPushNotificationService.sendNotification({
        type: notification.type,
        recipientId: notification.recipientId,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
      });
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    if (typeof window !== 'undefined') {
      if ((window as Window & { __notificationsPollingActive?: boolean }).__notificationsPollingActive) {
        return;
      }
      (window as Window & { __notificationsPollingActive?: boolean }).__notificationsPollingActive = true;
    }

    const pollForNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/ws');
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const lastHandledKey = `lastHandledQueuedCount_${session.user.id}`;
        const stored =
          typeof window !== 'undefined'
            ? Number(sessionStorage.getItem(lastHandledKey) || '0')
            : 0;
        const effectiveLast = Math.max(lastHandledCountRef.current, stored);
        const queuedNotifications = (data.notifications ?? []) as RealtimeNotification[];

        if (data.queuedCount > effectiveLast && queuedNotifications.length > effectiveLast) {
          const pending = queuedNotifications.slice(effectiveLast);
          console.log(`Showing ${pending.length} notification popup(s)`);
          await showQueuedPopups(pending);
          lastHandledCountRef.current = data.queuedCount;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(lastHandledKey, String(data.queuedCount));
          }
          await clearNotifications();
          return;
        }

        lastHandledCountRef.current = data.queuedCount;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(lastHandledKey, String(data.queuedCount));
        }
      } catch (error) {
        console.error('Failed to check notification service:', error);
      }
    };

    const interval = setInterval(pollForNotifications, 2000);
    pollForNotifications();

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        (window as Window & { __notificationsPollingActive?: boolean }).__notificationsPollingActive = false;
      }
    };
  }, [session?.user?.id, showQueuedPopups]);

  return {};
}
