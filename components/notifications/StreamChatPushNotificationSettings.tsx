"use client";

import React, { useState, useEffect } from 'react';
import { useStreamChatPushNotifications } from '@/hooks/notifications/useStreamChatPushNotifications';

export default function StreamChatPushNotificationSettings() {
  const {
    isSupported,
    isRegistered,
    isEnabled,
    isLoading,
    error,
    settings,
    registerForPushNotifications,
    unregisterFromPushNotifications,
    updateSettings
  } = useStreamChatPushNotifications();

  const [typePrefs, setTypePrefs] = useState<Record<string, boolean>>({
    message: true,
    reply: true,
    reaction: true,
    mention: true
  });

  // Initialize type preferences from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('streamchat_notification_types_enabled') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setTypePrefs(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  // Auto-register for Stream Chat push notifications if enabled by default
  useEffect(() => {
    if (isSupported && !isRegistered && !isLoading) {
      const streamChatEnabled = typeof window !== 'undefined' 
        ? window.localStorage.getItem('streamchat_notifications_enabled') === 'true'
        : false;
      
      // Only auto-register if explicitly enabled, not if it's just missing from localStorage
      if (streamChatEnabled) {
        console.log('🚀 Auto-registering for Stream Chat push notifications (enabled by default)');
        registerForPushNotifications();
      }
    }
  }, [isSupported, isRegistered, isLoading, registerForPushNotifications]);

  const toggleType = async (key: string) => {
    setTypePrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('streamchat_notification_types_enabled', JSON.stringify(next));
        }
      } catch {}
      // Attempt to forward settings to Stream if supported
      try {
        const mapped: any = {
          message: next.message,
          reply: next.reply,
          reaction: next.reaction,
          mention: next.mention
        };
        updateSettings?.(mapped);
      } catch {}
      return next;
    });
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800 font-medium">
            Push notifications are not supported in this browser
          </span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Please use a modern browser like Chrome, Firefox, Safari, or Edge to enable push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="p-4 bg-gray-50 rounded-[22px] border-[3px] border-gray-300">
        {/* Header row with toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Stream Chat Push Notifications</h3>
            <p className="text-sm text-gray-500">Show push notifications for Stream Chat on this device</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-700">{isEnabled ? 'Enabled' : 'Disabled'}{isRegistered ? ' • Registered with Stream' : ''}</span>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
          <button
            onClick={async () => { 
              if (!isEnabled) { 
                await registerForPushNotifications();
                localStorage.setItem('streamchat_notifications_enabled', 'true');
              } else { 
                await unregisterFromPushNotifications();
                localStorage.setItem('streamchat_notifications_enabled', 'false');
              } 
            }}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${isEnabled ? 'bg-green-500' : 'bg-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={isEnabled}
            type="button"
          >
            <span className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform" style={{ transform: isEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </div>

        {/* Per-type toggles */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: 'message', label: 'New messages' },
            { key: 'reply', label: 'Replies' },
            { key: 'reaction', label: 'Reactions' },
            { key: 'mention', label: 'Mentions' }
          ].map(item => (
            <label key={item.key} className={`flex items-center justify-between p-3 rounded-[14px] border-[2px] transition-colors ${isEnabled ? 'bg-gray-50 border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
              <span className={`text-sm transition-colors ${isEnabled ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
              <button 
                onClick={() => isEnabled && toggleType(item.key)} 
                disabled={!isEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${
                  !isEnabled 
                    ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                    : typePrefs[item.key] 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                }`} 
                aria-pressed={typePrefs[item.key]} 
                type="button"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform" style={{ transform: typePrefs[item.key] ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
