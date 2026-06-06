'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import ProfileEditModal from "@/components/profile/ProfileEditModal";
import StreamChatPushNotificationSettings from "@/components/notifications/StreamChatPushNotificationSettings";
// Testing components removed from settings page

interface SettingsClientProps {
  currentUser: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    image?: string;
    bio?: string;
  };
}

export default function SettingsClient({ currentUser }: SettingsClientProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userData, setUserData] = useState(currentUser);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [typePrefs, setTypePrefs] = useState<Record<string, boolean>>({
    like: true,
    dislike: true,
    comment: true,
    reply: true,
    follow: true,
    interested: true,
    comment_like: true
  });
  const [emailTypePrefs, setEmailTypePrefs] = useState<Record<string, boolean>>({
    like: true,
    dislike: true,
    comment: true,
    reply: true,
    follow: true,
    interested: true,
    comment_like: true
  });

  // Initialize notifications toggle from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('notifications_enabled');
        // Default to true (enabled) unless explicitly set to false
        if (stored === 'false') {
          setNotificationsEnabled(false);
        } else {
          setNotificationsEnabled(true);
          // If no preference is stored, set it to true in localStorage
          if (stored === null) {
            window.localStorage.setItem('notifications_enabled', 'true');
          }
        }

        const storedTypes = window.localStorage.getItem('notification_types_enabled');
        if (storedTypes) {
          try {
            const parsed = JSON.parse(storedTypes);
            if (parsed && typeof parsed === 'object') setTypePrefs((prev) => ({ ...prev, ...parsed }));
          } catch {}
        }

        // Initialize email preferences from server (fallback to localStorage)
        (async () => {
          try {
            const res = await fetch('/api/email-preferences');
            if (res.ok) {
              const data = await res.json();
              if (data?.preferences) {
                setEmailEnabled(!!data.preferences.enabled);
                setEmailTypePrefs(prev => ({ ...prev, ...(data.preferences.types || {}) }));
                window.localStorage.setItem('email_notifications_enabled', data.preferences.enabled ? 'true' : 'false');
                window.localStorage.setItem('email_notification_types_enabled', JSON.stringify(data.preferences.types || {}));
                return;
              }
            }
          } catch {}

          // Fallback to localStorage when server not available
          const emailStored = window.localStorage.getItem('email_notifications_enabled');
          if (emailStored === 'false') {
            setEmailEnabled(false);
          } else {
            setEmailEnabled(true);
            if (emailStored === null) {
              window.localStorage.setItem('email_notifications_enabled', 'true');
            }
          }

          const emailTypesStored = window.localStorage.getItem('email_notification_types_enabled');
          if (emailTypesStored) {
            try {
              const parsed = JSON.parse(emailTypesStored);
              if (parsed && typeof parsed === 'object') setEmailTypePrefs((prev) => ({ ...prev, ...parsed }));
            } catch {}
          }
        })();
      }
    } catch {}
  }, []);

  const toggleNotifications = async () => {
    try {
      const next = !notificationsEnabled;
      setNotificationsEnabled(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('notifications_enabled', next ? 'true' : 'false');
      }
      // Ask for browser permission when enabling
      if (next && typeof window !== 'undefined' && 'Notification' in window) {
        try { await Notification.requestPermission(); } catch {}
      }
    } catch {}
  };

  // Request browser permission on first load if notifications are enabled by default
  useEffect(() => {
    if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      // Only request permission if it hasn't been requested yet
      if (Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch {}
      }
    }
  }, [notificationsEnabled]);

  const toggleEmailNotifications = async () => {
    try {
      const next = !emailEnabled;
      setEmailEnabled(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('email_notifications_enabled', next ? 'true' : 'false');
      }
      try {
        await fetch('/api/email-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: { enabled: next } })
        });
      } catch {}
    } catch {}
  };

  const toggleType = (key: string) => {
    setTypePrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('notification_types_enabled', JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  const toggleEmailType = (key: string) => {
    setEmailTypePrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('email_notification_types_enabled', JSON.stringify(next));
        }
        // Persist to server
        (async () => {
          try {
            await fetch('/api/email-preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ preferences: { types: { [key]: next[key] } } })
            });
          } catch {}
        })();
      } catch {}
      return next;
    });
  };

  // Transform user data for the modal
  const currentProfile = {
    name: userData.name || '',
    bio: userData.bio || '',
    image: userData.image || '/default-avatar.png'
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    // Update the local state with the new profile data
    setUserData(prev => ({
      ...prev,
      name: updatedProfile.name,
      bio: updatedProfile.bio,
      image: updatedProfile.image
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚙️ Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account preferences and configurations.
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-[22px] shadow-200 border-[5px] border-black p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[22px] border-[3px] border-gray-300">
                    <div>
                      <h3 className="font-medium text-gray-900">Profile Information</h3>
                      <p className="text-sm text-gray-500">Update your name, bio, and profile picture</p>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-24"
                      onClick={() => setIsProfileModalOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          {/* Messaging & Push Notifications */}
          <div className="bg-white rounded-[22px] shadow-200 border-[5px] border-black p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messaging & Push Notifications</h2>
            <div className="p-4 bg-gray-50 rounded-[22px] border-[3px] border-gray-300">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Browser Push Notifications</h3>
                  <p className="text-sm text-gray-500">Show pop-up notifications on this device</p>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  aria-label="Toggle notifications"
                  aria-pressed={notificationsEnabled}
                  type="button"
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform"
                    style={{ transform: notificationsEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              {/* Notification type preferences (Browser Push) */}
              <div className="mt-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'like', label: 'Likes on my startup' },
                  { key: 'dislike', label: 'Dislikes on my startup' },
                  { key: 'comment', label: 'New comments' },
                  { key: 'reply', label: 'Replies to my comment' },
                  { key: 'follow', label: 'New followers' },
                  { key: 'interested', label: 'Interested in my startup' },
                  { key: 'comment_like', label: 'Likes on my comment' }
                ].map(item => (
                  <label key={item.key} className={`flex items-center justify-between p-3 rounded-[14px] border-[2px] transition-colors ${notificationsEnabled ? 'bg-gray-50 border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm transition-colors ${notificationsEnabled ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
                    <button
                      onClick={() => toggleType(item.key)}
                      disabled={!notificationsEnabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${notificationsEnabled ? (typePrefs[item.key] ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-200 cursor-not-allowed'}`}
                      aria-pressed={typePrefs[item.key]}
                      type="button"
                    >
                      <span
                        className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform"
                        style={{ transform: typePrefs[item.key] ? 'translateX(22px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </label>
                ))}
              </div>
              </div>
            </div>

            {/* Stream Chat push settings */}
            <div className="mt-6">
              <StreamChatPushNotificationSettings />
            </div>

            {/* Email Preferences */}
            <div className="mt-6 p-4 bg-gray-50 rounded-[22px] border-[3px] border-gray-300">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive email notifications for activities</p>
                </div>
                <button
                  onClick={toggleEmailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${emailEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  aria-label="Toggle email notifications"
                  aria-pressed={emailEnabled}
                  type="button"
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform"
                    style={{ transform: emailEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              {/* Email notification type preferences */}
              <div className="mt-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'like', label: 'Likes on my startup' },
                  { key: 'dislike', label: 'Dislikes on my startup' },
                  { key: 'comment', label: 'New comments' },
                  { key: 'reply', label: 'Replies to my comment' },
                  { key: 'follow', label: 'New followers' },
                  { key: 'interested', label: 'Interested in my startup' },
                  { key: 'comment_like', label: 'Likes on my comment' }
                ].map(item => (
                  <label key={item.key} className={`flex items-center justify-between p-3 rounded-[14px] border-[2px] transition-colors ${emailEnabled ? 'bg-gray-50 border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm transition-colors ${emailEnabled ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
                    <button
                      onClick={() => toggleEmailType(item.key)}
                      disabled={!emailEnabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border border-black ${emailEnabled ? (emailTypePrefs[item.key] ? 'bg-green-500' : 'bg-gray-300') : 'bg-gray-200 cursor-not-allowed'}`}
                      aria-pressed={emailTypePrefs[item.key]}
                      type="button"
                    >
                      <span
                        className="inline-block h-5 w-5 transform rounded-full bg-white border border-black transition-transform"
                        style={{ transform: emailTypePrefs[item.key] ? 'translateX(22px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </label>
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* Testing sections removed */}
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={currentProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}
