'use client';

import { useState, useEffect } from 'react';
import { UnifiedPushNotificationService } from '@/lib/notifications/unifiedPushNotifications';

interface TestNotification {
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export default function NotificationTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [notificationStats, setNotificationStats] = useState<any>(null);

  useEffect(() => {
    setIsSupported(UnifiedPushNotificationService.isSupported());
    setPermissionStatus(UnifiedPushNotificationService.getPermissionStatus());
    updateStats();
  }, []);

  const updateStats = () => {
    setNotificationStats(UnifiedPushNotificationService.getNotificationStats());
  };

  const testNotifications: TestNotification[] = [
    {
      type: 'like',
      title: 'New Like',
      message: 'John Doe liked your startup "Amazing App"',
      metadata: {
        startupId: 'test-startup-1',
        startupTitle: 'Amazing App',
        likerId: 'user-123',
        likerName: 'John Doe',
        likerImage: '/img01.jpeg'
      }
    },
    {
      type: 'dislike',
      title: 'New Dislike',
      message: 'Jane Smith disliked your startup "Cool Product"',
      metadata: {
        startupId: 'test-startup-2',
        startupTitle: 'Cool Product',
        dislikerId: 'user-456',
        dislikerName: 'Jane Smith',
        dislikerImage: '/img02.jpg'
      }
    },
    {
      type: 'comment',
      title: 'New Comment',
      message: 'Mike Johnson commented on your startup "Great Idea"',
      metadata: {
        startupId: 'test-startup-3',
        startupTitle: 'Great Idea',
        commenterId: 'user-789',
        commenterName: 'Mike Johnson',
        commenterImage: '/img03.jpg',
        commentText: 'This looks amazing!',
        isReply: false
      }
    },
    {
      type: 'comment',
      title: 'New Reply',
      message: 'Sarah Wilson replied to your comment on "Awesome Startup"',
      metadata: {
        startupId: 'test-startup-4',
        startupTitle: 'Awesome Startup',
        commenterId: 'user-101',
        commenterName: 'Sarah Wilson',
        commenterImage: '/img04.jpg',
        replyText: 'I totally agree!',
        parentCommentText: 'This is great',
        isReply: true
      }
    },
    {
      type: 'interested',
      title: 'New Interest',
      message: 'Alex Brown is interested in your startup "Innovative Solution"',
      metadata: {
        startupId: 'test-startup-5',
        startupTitle: 'Innovative Solution',
        interestedUserId: 'user-202',
        interestedUserName: 'Alex Brown',
        interestedUserImage: '/img05.jpg'
      }
    },
    {
      type: 'follow',
      title: 'New Follower',
      message: 'Emma Davis started following you',
      metadata: {
        followerId: 'user-303',
        followerName: 'Emma Davis',
        followerImage: '/img06.jpg',
        followerUsername: 'emma_davis'
      }
    }
  ];

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await UnifiedPushNotificationService.requestPermission();
      setPermissionStatus(UnifiedPushNotificationService.getPermissionStatus());
      if (granted) {
        setLastSent('✅ Notification permission granted! You can now test notifications.');
      } else {
        setLastSent('❌ Notification permission denied. Please enable notifications in your browser settings.');
      }
    } catch (error) {
      setLastSent(`❌ Error requesting permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async (notification: TestNotification) => {
    console.log('🧪 Testing notification:', notification);
    console.log('🔍 Current permission status:', permissionStatus);
    
    if (permissionStatus !== 'granted') {
      setLastSent('❌ Please grant notification permission first by clicking "Enable Notifications"');
      return;
    }

    setIsLoading(true);
    setLastSent(null);
    
    try {
      console.log('🔔 Calling UnifiedPushNotificationService.sendNotification...');
      const result = await UnifiedPushNotificationService.sendNotification({
        type: notification.type,
        recipientId: 'test-user-123', // This would be the actual user ID in production
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata
      });

      console.log('🔔 Service returned:', result);

      if (result) {
        setLastSent(`✅ ${notification.type} notification sent successfully! Check your browser notifications.`);
        updateStats();
      } else {
        setLastSent(`❌ Failed to send ${notification.type} notification - check console for details`);
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      setLastSent(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testServerNotification = async (notification: TestNotification) => {
    setIsLoading(true);
    setLastSent(null);
    
    try {
      console.log('🔔 Testing server-side notification...');
      const response = await fetch('/api/dev/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      const result = await response.json();
      console.log('🔔 Server response:', result);

      if (result.success) {
        setLastSent(`✅ Server ${notification.type} notification sent successfully! Check server logs.`);
      } else {
        setLastSent(`❌ Server notification failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error testing server notification:', error);
      setLastSent(`❌ Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllNotifications = () => {
    UnifiedPushNotificationService.clearAllNotifications();
    updateStats();
    setLastSent('🧹 All notifications cleared');
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Test Push Notifications</h3>
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          ❌ Your browser does not support notifications. Please use a modern browser like Chrome, Firefox, or Edge.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Test Push Notifications</h3>
      
      {/* Permission Status */}
      <div className="mb-4 p-3 rounded-md bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Notification Permission: </span>
            <span className={`font-mono text-sm ${
              permissionStatus === 'granted' ? 'text-green-600' : 
              permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permissionStatus.toUpperCase()}
            </span>
          </div>
          {permissionStatus !== 'granted' && (
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Requesting...' : 'Enable Notifications'}
            </button>
          )}
        </div>
      </div>

      {/* Debug Information */}
      {notificationStats && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-yellow-800">Debug Info: </span>
              <span className="text-sm text-yellow-700">
                Active: {notificationStats.activeCount} | Total Sent: {notificationStats.totalSent}
              </span>
            </div>
            <button
              onClick={clearAllNotifications}
              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        {permissionStatus === 'granted' 
          ? 'Click any button below to test different types of push notifications.'
          : 'Please enable notifications first to test push notifications.'
        }
      </p>
      
      {lastSent && (
        <div className={`mb-4 p-3 rounded-md ${
          lastSent.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {lastSent}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testNotifications.map((notification, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-left">
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {notification.message}
                  </div>
                </div>
                <div className="text-xs text-gray-400 uppercase font-mono">
                  {notification.type}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => sendTestNotification(notification)}
                  disabled={isLoading || permissionStatus !== 'granted'}
                  className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Client
                </button>
                <button
                  onClick={() => testServerNotification(notification)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Server
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>Client Test (Browser Notifications):</strong>
            <ol className="ml-4 space-y-1">
              <li>1. Click "Enable Notifications" if permission is not granted</li>
              <li>2. Click "Test Client" for any notification type</li>
              <li>3. You should see a browser notification popup</li>
            </ol>
          </div>
          <div>
            <strong>Server Test (API Logs):</strong>
            <ol className="ml-4 space-y-1">
              <li>1. Click "Test Server" for any notification type</li>
              <li>2. Check the server console/logs for notification messages</li>
              <li>3. This tests the server-side notification system</li>
            </ol>
          </div>
        </div>
        {permissionStatus === 'denied' && (
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
            <strong>Permission Denied:</strong> Go to your browser settings and enable notifications for this site, then refresh the page.
          </div>
        )}
      </div>
    </div>
  );
}
