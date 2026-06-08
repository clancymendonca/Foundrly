'use client';

import { useState } from 'react';
import { useClientNotifications } from '@/hooks/notifications/useClientNotifications';

export default function SimpleNotificationTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const { showNotification } = useClientNotifications();

  const testBasicNotification = async () => {
    setIsLoading(true);
    setLastResult('');
    
    try {
      console.log('🧪 Testing basic notification...');
      const result = await showNotification({
        type: 'like',
        title: 'Test Notification',
        message: 'This is a test notification from the hook',
        metadata: { test: true }
      });
      
      setLastResult(result ? '✅ Notification sent successfully!' : '❌ Notification failed');
      console.log('🧪 Test result:', result);
    } catch (error) {
      setLastResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('🧪 Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Simple Notification Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        This tests the basic notification system without any complex logic.
      </p>
      
      <button
        onClick={testBasicNotification}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Testing...' : 'Test Basic Notification'}
      </button>
      
      {lastResult && (
        <div className={`mt-4 p-3 rounded-md ${
          lastResult.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {lastResult}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Debug Steps:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click the button above</li>
          <li>2. Check browser console for detailed logs</li>
          <li>3. Look for notification permission status</li>
          <li>4. Check if you see a browser notification popup</li>
        </ol>
      </div>
    </div>
  );
}
