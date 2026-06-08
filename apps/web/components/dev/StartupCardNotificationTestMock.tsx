'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClientNotifications } from '@/hooks/notifications/useClientNotifications';

export default function StartupCardNotificationTestMock() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { showLikeNotification, showDislikeNotification, showInterestedNotification } = useClientNotifications();

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLikeNotification = async () => {
    try {
      addDebugInfo('Testing like notification...');
      await showLikeNotification('Amazing Test Startup', 'John Doe');
      addDebugInfo('✅ Like notification sent successfully');
    } catch (error) {
      addDebugInfo(`❌ Like notification failed: ${error}`);
    }
  };

  const testDislikeNotification = async () => {
    try {
      addDebugInfo('Testing dislike notification...');
      await showDislikeNotification('Amazing Test Startup', 'John Doe');
      addDebugInfo('✅ Dislike notification sent successfully');
    } catch (error) {
      addDebugInfo(`❌ Dislike notification failed: ${error}`);
    }
  };

  const testInterestedNotification = async () => {
    try {
      addDebugInfo('Testing interested notification...');
      await showInterestedNotification('Amazing Test Startup', 'John Doe');
      addDebugInfo('✅ Interested notification sent successfully');
    } catch (error) {
      addDebugInfo(`❌ Interested notification failed: ${error}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Direct Notification Testing</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test notifications directly without API calls. This bypasses the StartupCard component
        and tests the notification system directly.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Button 
          onClick={testLikeNotification}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Test Like Notification
        </Button>
        <Button 
          onClick={testDislikeNotification}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Test Dislike Notification
        </Button>
        <Button 
          onClick={testInterestedNotification}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Test Interested Notification
        </Button>
      </div>

      {/* Debug Information */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <h4 className="font-medium text-yellow-900 mb-2">Debug Information:</h4>
        <div className="text-xs text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <div>No debug info yet. Try clicking the buttons above.</div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))
          )}
        </div>
        <button
          onClick={() => setDebugInfo([])}
          className="mt-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Clear Debug
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Make sure you've granted notification permissions to your browser</li>
          <li>2. Click any of the test buttons above</li>
          <li>3. You should see a browser notification appear</li>
          <li>4. Check the debug info above for any errors</li>
          <li>5. If notifications don't work, check browser console for errors</li>
        </ol>
      </div>
    </div>
  );
}
