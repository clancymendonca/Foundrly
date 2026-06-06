'use client';

import { useState } from 'react';
import { useClientNotifications } from '@/hooks/notifications/useClientNotifications';

interface NotificationTestButtonProps {
  type: 'like' | 'dislike' | 'comment' | 'reply' | 'interested' | 'follow';
  title: string;
  message: string;
  metadata?: any;
}

export default function NotificationTestButton({ type, title, message, metadata }: NotificationTestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useClientNotifications();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await showNotification({
        type,
        title,
        message,
        metadata
      });
      console.log(`✅ ${type} notification sent from real component`);
    } catch (error) {
      console.error(`❌ Failed to send ${type} notification:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
        isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isLoading ? 'Sending...' : `Test ${type} Notification`}
    </button>
  );
}
