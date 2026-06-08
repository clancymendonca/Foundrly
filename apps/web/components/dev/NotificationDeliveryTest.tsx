'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export default function NotificationDeliveryTest() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNotificationDelivery = async () => {
    if (!session?.user?.id) {
      addTestResult('❌ No user session found');
      return;
    }

    setIsLoading(true);
    addTestResult('🧪 Testing notification delivery system...');

    try {
      // Test browser notification support first
      addTestResult('🔍 Checking browser notification support...');
      
      if (!('Notification' in window)) {
        addTestResult('❌ This browser does not support notifications');
        return;
      }
      
      addTestResult(`✅ Browser supports notifications`);
      addTestResult(`📊 Current permission: ${Notification.permission}`);
      
      if (Notification.permission === 'denied') {
        addTestResult('❌ Notifications are blocked. Please enable them in your browser settings.');
        return;
      }
      
      if (Notification.permission === 'default') {
        addTestResult('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        addTestResult(`📊 Permission result: ${permission}`);
        
        if (permission !== 'granted') {
          addTestResult('❌ Notification permission denied');
          return;
        }
      }
      
      // Test direct browser notification
      addTestResult('🧪 Testing direct browser notification...');
      const testNotification = new Notification('Test Notification', {
        body: 'This is a test to verify browser notifications work',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      
      testNotification.onclick = () => {
        addTestResult('✅ Test notification was clicked!');
        window.focus();
      };
      
      testNotification.onshow = () => {
        addTestResult('✅ Test notification was shown!');
      };
      
      testNotification.onerror = (error) => {
        addTestResult(`❌ Test notification error: ${error}`);
      };
      
      addTestResult('✅ Test notification sent! Check if you see a popup.');
      
      // Test the notification service endpoint
      const response = await fetch('/api/notifications/ws');
      const data = await response.json();
      
      addTestResult(`✅ Notification service status: ${JSON.stringify(data)}`);
      
      if (data.queuedCount > 0) {
        addTestResult(`🔔 You have ${data.queuedCount} queued notifications!`);
        addTestResult('💡 These should appear as popups when you visit the site');
      }
      
    } catch (error) {
      addTestResult(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Poll for notification count
  useEffect(() => {
    if (!session?.user?.id) return;

    const pollForCount = async () => {
      try {
        const response = await fetch('/api/notifications/ws');
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.queuedCount || 0);
        }
      } catch (error) {
        console.error('Failed to get notification count:', error);
      }
    };

    // Poll every 2 seconds for instant updates
    const interval = setInterval(pollForCount, 2000);
    pollForCount(); // Initial check

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Notification Delivery Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test the notification delivery system to ensure startup owners receive notifications.
        <br />
        <strong>Simple Behavior:</strong> Any new notification will show a popup within 2 seconds.
      </p>
      
      {/* Notification Counter */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Queued Notifications:</span>
          <span className="text-lg font-bold text-blue-600">{notificationCount}</span>
        </div>
        {notificationCount > 0 && (
          <p className="text-xs text-green-700 mt-1">
            {notificationCount} notification(s) queued! You should see a notification popup within 2 seconds.
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testNotificationDelivery}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : '🧪 Test Notification Delivery'}
          </Button>
          
          <Button 
            onClick={() => {
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification('Quick Test', {
                  body: 'This is a quick test notification',
                  icon: '/favicon.ico',
                  tag: `test-${Date.now()}`
                });
                addTestResult('✅ Quick test notification sent!');
              } else {
                addTestResult('❌ Browser notifications not available or permission not granted');
              }
            }}
            variant="outline"
            className="w-full"
          >
            🔔 Quick Test Notification
          </Button>
        </div>
        
        <Button 
          onClick={() => {
            addTestResult('🔄 Refreshing notification count...');
            setNotificationCount(0); // Reset to force refresh
          }}
          variant="secondary"
          className="w-full"
        >
          🔄 Refresh Notification Count
        </Button>
        
        <Button 
          onClick={async () => {
            try {
              const response = await fetch('/api/notifications/ws', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'clear' }),
              });
              
              if (response.ok) {
                addTestResult('🧹 Notifications cleared successfully');
                setNotificationCount(0);
              } else {
                addTestResult('❌ Failed to clear notifications');
              }
            } catch (error) {
              addTestResult('❌ Error clearing notifications');
            }
          }}
          variant="destructive"
          className="w-full"
        >
          🧹 Clear All Notifications
        </Button>
        
        <Button 
          onClick={() => {
            // Test individual notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('Test Individual Notification', {
                body: 'John liked your startup "EcoRide"',
                icon: '/favicon.ico',
                tag: `test-individual-${Date.now()}`,
                requireInteraction: true,
                silent: false
              });
              
              notification.onshow = () => {
                addTestResult('✅ Notification shown successfully!');
              };
              
              notification.onerror = (error) => {
                addTestResult(`❌ Notification error: ${error}`);
              };
              
              notification.onclick = () => {
                addTestResult('🔔 Notification clicked!');
              };
              
              addTestResult('✅ Individual notification test sent!');
            } else {
              addTestResult(`❌ Browser notifications not available. Permission: ${Notification.permission}`);
            }
          }}
          variant="outline"
          className="w-full"
        >
          🧪 Test Individual Notification
        </Button>
        
        <Button 
          onClick={() => {
            // Check notification permission
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                addTestResult('✅ Notification permission is granted');
              } else if (Notification.permission === 'denied') {
                addTestResult('❌ Notification permission is denied');
              } else {
                addTestResult('⚠️ Notification permission not requested yet');
                Notification.requestPermission().then(permission => {
                  addTestResult(`🔔 Permission result: ${permission}`);
                });
              }
            } else {
              addTestResult('❌ This browser does not support notifications');
            }
          }}
          variant="secondary"
          className="w-full"
        >
          🔍 Check Notification Permission
        </Button>
        
        <Button 
          onClick={() => {
            // Force notification with minimal options
            try {
              const notification = new Notification('FORCE TEST', {
                body: 'This should definitely show!',
                silent: false
              });
              
              notification.onshow = () => {
                addTestResult('🎉 FORCE notification shown!');
              };
              
              notification.onerror = (error) => {
                addTestResult(`❌ FORCE notification error: ${error}`);
              };
              
              addTestResult('🚀 FORCE notification sent!');
            } catch (error) {
              addTestResult(`❌ FORCE notification failed: ${error}`);
            }
          }}
          variant="destructive"
          className="w-full"
        >
          🚀 FORCE Notification Test
        </Button>

        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">Test Results:</h4>
              <button
                onClick={clearResults}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="text-xs text-gray-700 space-y-1 max-h-32 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">How to Test Real Notifications:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Click "🔔 Quick Test Notification" to verify browser notifications work</li>
            <li>2. If no popup appears, check your browser notification settings</li>
            <li>3. Open this page in two different browser windows/tabs</li>
            <li>4. Log in as different users in each window</li>
            <li>5. In one window, like a startup owned by the other user</li>
            <li>6. The startup owner should receive a notification</li>
            <li>7. Check the console logs for delivery confirmation</li>
          </ol>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• If notifications don't appear, check your browser's notification settings</li>
            <li>• Make sure notifications are allowed for this website</li>
            <li>• Try refreshing the page and testing again</li>
            <li>• Check if your browser is in focus when testing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
