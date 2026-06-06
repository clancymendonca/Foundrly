'use client';

import { useState, useEffect } from 'react';
import { enableNotificationPreferences } from '@/lib/notifications/defaults';

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      return;
    }

    const status = Notification.permission;
    setPermissionStatus(status);

    if (status === 'granted') {
      enableNotificationPreferences();
      return;
    }

    const dismissed = localStorage.getItem('notification_prompt_dismissed') === 'true';
    if (status === 'default' && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        enableNotificationPreferences();
        console.log('✅ Notification permission granted and enabled');
      }

      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  const handleBlock = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
    localStorage.setItem('notifications_enabled', 'false');
  };

  if (!showPrompt || permissionStatus !== 'default') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="startup-card max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7M4.828 7H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M4.828 7l2.586-2.586a2 2 0 012.828 0L12 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Enable Notifications
          </h2>

          <p className="text-gray-600 mb-6">
            Stay updated with likes, comments, and new followers on your startup!
            We&apos;ll send you instant notifications when someone interacts with your content.
          </p>

          <div className="text-left bg-gray-50 rounded-[14px] p-4 mb-6 border-[2px] border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">You&apos;ll get notified for:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Likes on your startup</li>
              <li>• New comments and replies</li>
              <li>• New chat messages and mentions</li>
              <li>• New followers</li>
              <li>• Interest in your startup</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAllow}
              className="flex-1 bg-green-600 text-white font-semibold py-3 px-4 rounded-[14px] hover:bg-green-700 transition-colors border-2 border-green-600"
            >
              Allow Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-[14px] hover:bg-gray-300 transition-colors border-2 border-gray-300"
            >
              Maybe Later
            </button>
          </div>

          <button
            onClick={handleBlock}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Don&apos;t show this again
          </button>
        </div>
      </div>
    </div>
  );
}
