"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { StreamChatPushService } from '@/lib/notifications/streamChatPushNotifications';
import { isFcmRegistrationError } from '@/lib/notifications/firebase-client';
import { StreamChat } from 'stream-chat';

// Interface for push notification state
interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  settings: any;
}

// Hook for managing Stream Chat push notifications
export const useStreamChatPushNotifications = (existingChatClient?: StreamChat) => {
  const { data: session } = useSession();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    isEnabled: false,
    isLoading: false,
    error: null,
    settings: {}
  });

  // Get the Stream Chat push notification service instance
  const streamChatPushService = StreamChatPushService.getInstance();

  // Check Stream Chat push notification status
  const checkStreamChatStatus = useCallback(async () => {
    if (!session?.user?.id || !streamChatPushService.isReady()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if user is registered for push notifications
      const settings = await streamChatPushService.getPushNotificationSettings();
      const isRegistered = settings?.push?.enabled || false;
      
      setState(prev => ({
        ...prev,
        isRegistered,
        isEnabled: isRegistered,
        isLoading: false
      }));
    } catch (error) {
      console.error('❌ Error checking Stream Chat push notification status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check Stream Chat status'
      }));
    }
  }, [session?.user?.id, streamChatPushService]);

  // Initialize push notification service
  useEffect(() => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    // Check if push notifications are supported
    const supported = streamChatPushService.isSupported();
    setState(prev => ({ ...prev, isSupported: supported }));

    if (supported && existingChatClient) {
      // Use the existing Stream Chat client
      streamChatPushService.setChatClient(existingChatClient);
      console.log('✅ Using existing Stream Chat client for push notifications');
      // Check status after setting client
      checkStreamChatStatus();
    } else if (supported && !existingChatClient) {
      // Initialize a new client if no existing one is provided
      const initializeService = async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true, error: null }));

          const res = await fetch("/api/chat/token", {
            method: "POST",
            body: JSON.stringify({ userId: session.user.id }),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            throw new Error('Failed to get chat token');
          }

          const { token } = await res.json();
          const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
          
          await streamChatPushService.initialize(apiKey, session.user.id, token);
          
          setState(prev => ({ ...prev, isLoading: false, error: null }));
          
          // Check status after initialization
          checkStreamChatStatus();
        } catch (error) {
          console.error('❌ Failed to initialize Stream Chat for push notifications:', error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize Stream Chat'
          }));
        }
      };

      initializeService();
    }
  }, [session?.user?.id, existingChatClient, checkStreamChatStatus]);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    // Ensure Stream Chat client is initialized if not ready
    if (!streamChatPushService.isReady()) {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const res = await fetch("/api/chat/token", {
          method: "POST",
          body: JSON.stringify({ userId: session.user.id }),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to get chat token');
        }
        const { token } = await res.json();
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
        if (!apiKey) {
          throw new Error('Missing NEXT_PUBLIC_STREAM_API_KEY');
        }
        await streamChatPushService.initialize(apiKey, session.user.id, token);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to initialize Stream Chat';
        setState(prev => ({ ...prev, isLoading: false, error: message }));
        return false;
      }
    }

    // Retry mechanism for connection issues
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const success = await streamChatPushService.registerForPushNotifications();
        
        if (success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isRegistered: true,
            isEnabled: true,
            error: null
          }));
          return true;
        } else {
          throw new Error('Failed to register for push notifications');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        
        // Configuration/auth errors won't succeed on retry
        if (
          isFcmRegistrationError(lastError.message) ||
          lastError.message.includes('permission denied') ||
          lastError.message.includes('not supported')
        ) {
          break;
        }

        // If it's a connection issue, wait before retrying
        if (attempt < maxRetries && (
          lastError.message.includes('not connected') || 
          lastError.message.includes('disconnected') ||
          lastError.message.includes('User ID is required')
        )) {
          console.log(`⏳ Waiting before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        // If it's not a connection issue or we've exhausted retries, break
        break;
      }
    }

    // All retries failed
    console.error('❌ All retry attempts failed for push notification registration');
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: lastError?.message || 'Failed to register for push notifications after multiple attempts'
    }));
    return false;
  }, [session?.user?.id, streamChatPushService]);

  // Unregister from push notifications
  const unregisterFromPushNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    if (!streamChatPushService.isReady()) {
      setState(prev => ({ ...prev, error: 'Stream Chat service not ready' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const success = await streamChatPushService.unregisterFromPushNotifications();
      
      if (success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isRegistered: false,
          isEnabled: false,
          error: null
        }));
        return true;
      } else {
        throw new Error('Failed to unregister from push notifications');
      }
    } catch (error) {
      console.error('❌ Failed to unregister from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unregister from push notifications'
      }));
      return false;
    }
  }, [session?.user?.id, streamChatPushService]);

  // Update push notification settings
  const updateSettings = useCallback(async (newSettings: any) => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    if (!streamChatPushService.isReady()) {
      setState(prev => ({ ...prev, error: 'Stream Chat service not ready' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const success = await streamChatPushService.updatePushNotificationSettings(newSettings);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          settings: newSettings,
          error: null
        }));
        return true;
      } else {
        throw new Error('Failed to update push notification settings');
      }
    } catch (error) {
      console.error('❌ Failed to update push notification settings:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update push notification settings'
      }));
      return false;
    }
  }, [session?.user?.id, streamChatPushService]);

  // Send test push notification
  const sendTestNotification = useCallback(async (channelId: string, message: string) => {
    if (!session?.user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    if (!streamChatPushService.isReady()) {
      setState(prev => ({ ...prev, error: 'Stream Chat service not ready' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const success = await streamChatPushService.sendPushNotification(channelId, message, session.user.id);
      
      if (success) {
        setState(prev => ({ ...prev, isLoading: false, error: null }));
        return true;
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send test notification'
      }));
      return false;
    }
  }, [session?.user?.id, streamChatPushService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamChatPushService.disconnect();
    };
  }, []);

  return {
    ...state,
    registerForPushNotifications,
    unregisterFromPushNotifications,
    updateSettings,
    sendTestNotification,
    checkStreamChatStatus,
    initializeStreamChat: () => {
      // This function is no longer needed as initialization is handled by useEffect
      // Keeping it for now, but it will be removed if not used elsewhere.
    }
  };
}
