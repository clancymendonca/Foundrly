'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/notifications/usePushNotifications';
import { Bell, BellOff, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    clearError
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              Not supported in this browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (permission === 'granted' && isSubscribed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (permission === 'denied') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (permission === 'granted' && isSubscribed) {
      return 'Enabled';
    } else if (permission === 'denied') {
      return 'Blocked';
    } else if (permission === 'default') {
      return 'Not configured';
    } else {
      return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (permission === 'granted' && isSubscribed) {
      return 'text-green-600 bg-green-50';
    } else if (permission === 'denied') {
      return 'text-red-600 bg-red-50';
    } else {
      return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Status */}
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                Get notified about new activities
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
          <h4 className="font-medium text-gray-900">Notification Settings</h4>
          
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Permission Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Permission Status</p>
            <div className="flex items-center gap-2">
              {permission === 'granted' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : permission === 'denied' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm text-gray-600 capitalize">
                {permission === 'default' ? 'Not requested' : permission}
              </span>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Subscription Status</p>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isSubscribed ? 'Subscribed' : 'Not subscribed'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {permission === 'default' && (
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </button>
            )}

            {permission === 'granted' && !isSubscribed && (
              <button
                onClick={subscribe}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe to Notifications'}
              </button>
            )}

            {permission === 'granted' && isSubscribed && (
              <button
                onClick={unsubscribe}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            )}

            {permission === 'denied' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Push notifications work even when the app is closed</p>
            <p>• You'll receive notifications for follows, comments, likes, and moderation updates</p>
            <p>• You can change these settings anytime</p>
          </div>
        </div>
      )}
    </div>
  );
} 