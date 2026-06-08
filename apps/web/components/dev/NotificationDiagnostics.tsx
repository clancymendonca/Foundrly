'use client';

import { useState, useEffect } from 'react';
import { UnifiedPushNotificationService } from '@/lib/notifications/unifiedPushNotifications';

export default function NotificationDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      notifications: {
        supported: 'Notification' in window,
        permission: Notification.permission,
        maxActions: Notification.maxActions || 'Not specified',
        prototype: Object.getOwnPropertyNames(Notification.prototype)
      },
      service: UnifiedPushNotificationService.getNotificationStats(),
      test: {
        canSend: UnifiedPushNotificationService.canSendNotification(),
        isSupported: UnifiedPushNotificationService.isSupported()
      }
    };

    // Test notification creation
    try {
      if (Notification.permission === 'granted') {
        const testNotification = new Notification('Diagnostic Test', {
          body: 'This is a test notification for diagnostics',
          tag: 'diagnostic-test',
          silent: true
        });
        
        results.test.notificationCreated = true;
        results.test.notificationError = null;
        
        // Close immediately
        setTimeout(() => testNotification.close(), 100);
      } else {
        results.test.notificationCreated = false;
        results.test.notificationError = 'Permission not granted';
      }
    } catch (error) {
      results.test.notificationCreated = false;
      results.test.notificationError = error instanceof Error ? error.message : 'Unknown error';
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Notification Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Refresh'}
        </button>
      </div>

      {diagnostics && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Browser Support</h4>
            <div className="text-sm space-y-1">
              <div>Notifications Supported: <span className={diagnostics.notifications.supported ? 'text-green-600' : 'text-red-600'}>{diagnostics.notifications.supported ? 'Yes' : 'No'}</span></div>
              <div>Permission: <span className={`${diagnostics.notifications.permission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>{diagnostics.notifications.permission}</span></div>
              <div>Max Actions: {diagnostics.notifications.maxActions}</div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Service Status</h4>
            <div className="text-sm space-y-1">
              <div>Can Send: <span className={diagnostics.test.canSend ? 'text-green-600' : 'text-red-600'}>{diagnostics.test.canSend ? 'Yes' : 'No'}</span></div>
              <div>Is Supported: <span className={diagnostics.test.isSupported ? 'text-green-600' : 'text-red-600'}>{diagnostics.test.isSupported ? 'Yes' : 'No'}</span></div>
              <div>Active Notifications: {diagnostics.service.activeCount}</div>
              <div>Total Sent: {diagnostics.service.totalSent}</div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Test Results</h4>
            <div className="text-sm space-y-1">
              <div>Notification Created: <span className={diagnostics.test.notificationCreated ? 'text-green-600' : 'text-red-600'}>{diagnostics.test.notificationCreated ? 'Yes' : 'No'}</span></div>
              {diagnostics.test.notificationError && (
                <div className="text-red-600">Error: {diagnostics.test.notificationError}</div>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Browser Info</h4>
            <div className="text-xs space-y-1 text-gray-600">
              <div>Platform: {diagnostics.browser.platform}</div>
              <div>Language: {diagnostics.browser.language}</div>
              <div>Online: {diagnostics.browser.onLine ? 'Yes' : 'No'}</div>
              <div>Cookies: {diagnostics.browser.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {!diagnostics.notifications.supported && (
                <li>• Your browser doesn't support notifications. Try Chrome, Firefox, or Edge.</li>
              )}
              {diagnostics.notifications.permission === 'denied' && (
                <li>• Notifications are blocked. Go to browser settings and allow notifications for this site.</li>
              )}
              {diagnostics.notifications.permission === 'default' && (
                <li>• Click "Enable Notifications" to request permission.</li>
              )}
              {diagnostics.service.activeCount > 3 && (
                <li>• You have many active notifications. Try clicking "Clear All" to reset.</li>
              )}
              {!diagnostics.browser.onLine && (
                <li>• You appear to be offline. Check your internet connection.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
