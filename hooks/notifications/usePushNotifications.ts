import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PushNotificationService } from '@/lib/notifications/pushNotifications';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { data: session } = useSession();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null
  });

  // Check support and permission on mount
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = PushNotificationService.isSupported();
      const permission = isSupported ? Notification.permission : 'default';
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission
      }));
    };

    checkSupport();
  }, []);

  // Check subscription status
  useEffect(() => {
    if (session?.user?.id && state.isSupported) {
      checkSubscriptionStatus();
    }
  }, [session?.user?.id, state.isSupported]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if service worker is registered and has subscription
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState(prev => ({
          ...prev,
          isSubscribed: !!subscription,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check subscription status'
      }));
    }
  }, [session?.user?.id]);

  const subscribe = useCallback(async () => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const subscription = await PushNotificationService.subscribeUser(session.user.id);
      
      if (subscription) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to subscribe to push notifications'
        }));
      }
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe'
      }));
    }
  }, [session?.user?.id]);

  const unsubscribe = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get current subscription and unsubscribe
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe'
      }));
    }
  }, [session?.user?.id]);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const permission = await PushNotificationService.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isLoading: false
      }));

      // If permission granted, subscribe automatically
      if (permission === 'granted') {
        await subscribe();
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request permission'
      }));
    }
  }, [state.isSupported, subscribe]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    clearError,
    checkSubscriptionStatus
  };
} 