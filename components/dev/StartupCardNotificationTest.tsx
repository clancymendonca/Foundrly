'use client';

import { useState, useEffect } from 'react';
import StartupCard from '@/components/startup/StartupCard';
import { Author, Startup } from '@/sanity/types';
import { client } from '@/sanity/lib/client';
import { useSession } from 'next-auth/react';

// Mock data for testing (fallback)
const mockStartup: Omit<Startup, "author"> & { author?: Author } = {
  _id: 'test-startup-1',
  _createdAt: new Date().toISOString(),
  title: 'Amazing Test Startup',
  description: 'This is a test startup to demonstrate push notifications',
  category: 'Technology',
  image: '/img01.jpeg',
  views: 100,
  slug: { current: 'amazing-test-startup' }
};

const mockAuthor: Author = {
  _id: 'test-author-1',
  name: 'Test Author',
  username: 'testauthor',
  image: '/img02.jpg'
};

export default function StartupCardNotificationTest() {
  const { data: session } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userId, setUserId] = useState('test-user-123');
  const [currentUserName, setCurrentUserName] = useState('John Doe');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testStartup, setTestStartup] = useState<Startup | null>(null);
  const [testAuthor, setTestAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(true);
  const [useRealUserId, setUseRealUserId] = useState(true);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Update userId when useRealUserId changes or session changes
  useEffect(() => {
    if (useRealUserId && session?.user?.id) {
      setUserId(session.user.id);
      addDebugInfo(`Using real user ID: ${session.user.id}`);
    } else if (!useRealUserId) {
      setUserId('test-user-123');
      addDebugInfo('Using test user ID: test-user-123');
    }
  }, [useRealUserId, session?.user?.id]);

  // Update currentUserName when session changes
  useEffect(() => {
    if (session?.user?.name) {
      setCurrentUserName(session.user.name);
    }
  }, [session?.user?.name]);

  // Fetch a real startup for testing
  useEffect(() => {
    const fetchTestData = async () => {
      if (!useRealData) {
        setLoading(false);
        return;
      }

      try {
        addDebugInfo('Fetching real startup data for testing...');
        
        // Fetch a random startup
        const startup = await client.fetch(`
          *[_type == "startup"] | order(_createdAt desc) [0] {
            _id,
            _createdAt,
            title,
            description,
            category,
            image,
            views,
            slug,
            author->{
              _id,
              name,
              username,
              image
            }
          }
        `);

        if (startup) {
          setTestStartup(startup);
          setTestAuthor(startup.author);
          addDebugInfo(`✅ Loaded real startup: "${startup.title}" by ${startup.author?.name || 'Unknown'}`);
        } else {
          addDebugInfo('⚠️ No real startups found, using mock data');
          setTestStartup(mockStartup as Startup);
          setTestAuthor(mockAuthor);
        }
      } catch (error) {
        console.error('Error fetching test data:', error);
        addDebugInfo(`❌ Error fetching real data: ${error}`);
        addDebugInfo('Falling back to mock data');
        setTestStartup(mockStartup as Startup);
        setTestAuthor(mockAuthor);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [useRealData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">StartupCard with Notifications</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading test data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">StartupCard with Notifications</h3>
      <p className="text-sm text-gray-600 mb-4">
        This is a real StartupCard component with push notifications enabled. 
        Try liking, disliking, or showing interest to see notifications.
      </p>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Test Controls:</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useRealData}
              onChange={(e) => setUseRealData(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Use Real Data (from Sanity)</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isLoggedIn}
              onChange={(e) => setIsLoggedIn(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Logged In</span>
          </label>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Current User Name:</label>
            <input
              type="text"
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useRealUserId}
              onChange={(e) => setUseRealUserId(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Use Real User ID (from session)</span>
          </label>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Test User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={useRealUserId}
              className="px-2 py-1 border rounded text-sm disabled:bg-gray-100"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if ('Notification' in window) {
                  new Notification('Test Notification', {
                    body: 'This is a test notification to verify your browser settings',
                    icon: '/favicon.ico'
                  });
                  addDebugInfo('✅ Test notification sent directly');
                } else {
                  addDebugInfo('❌ Browser does not support notifications');
                }
              }}
              className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              🧪 Test Browser Notification
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        {testStartup && testAuthor ? (
          <StartupCard
            post={{ ...testStartup, author: testAuthor }}
            isOwner={false}
            isLoggedIn={isLoggedIn}
            userId={userId}
            currentUserName={currentUserName}
            showDescription={true}
            showCategory={true}
            showLikesDislikes={true}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No test data available. Please check your Sanity connection or use mock data.
          </div>
        )}
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

      <div className="mt-4 p-3 bg-green-50 rounded-md">
        <h4 className="font-medium text-green-900 mb-2">How to Test:</h4>
        <ol className="text-sm text-green-800 space-y-1">
          <li>1. Choose "Use Real Data" to test with actual startups from your database</li>
          <li>2. Make sure "Logged In" is checked</li>
          <li>3. Enable "Use Real User ID" to use your authenticated session (recommended)</li>
          <li>4. If using test user ID, make sure it's different from the startup author</li>
          <li>5. Click the Like button - you should see a notification</li>
          <li>6. Click the Dislike button - you should see a notification</li>
          <li>7. Click the Interested button - you should see a notification</li>
          <li>8. Check browser console for notification logs and debug info above</li>
        </ol>
        <div className="mt-2 text-xs text-green-700">
          <strong>Note:</strong> Notifications only show when you're not the owner of the startup and when it's a new action (not already liked/disliked).
        </div>
        <div className="mt-2 text-xs text-orange-700">
          <strong>Debug Tip:</strong> Check the browser console for detailed debug information about why notifications are or aren't showing.
        </div>
        <div className="mt-2 text-xs text-blue-700">
          <strong>API Note:</strong> The API uses your authenticated session user ID, not the test user ID. Enable "Use Real User ID" for proper testing.
        </div>
        <div className="mt-2 text-xs text-purple-700">
          <strong>Troubleshooting:</strong> If you don't see notifications, try the "🧪 Test Browser Notification" button above to verify your browser settings.
        </div>
      </div>
    </div>
  );
}
