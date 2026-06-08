// Service Worker for Stream Chat Push Notifications
// This service worker handles push notifications specifically for Stream Chat messaging

const CACHE_NAME = 'stream-chat-push-v1';
const NOTIFICATION_ICON = '/icons/chat-notification.svg';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🚀 Stream Chat Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Stream Chat cache opened');
        return cache.addAll([
          NOTIFICATION_ICON,
          '/icons/notification.svg'
        ]);
      })
      .catch((error) => {
        console.error('❌ Error during Stream Chat service worker install:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Stream Chat Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications from Stream Chat
self.addEventListener('push', (event) => {
  console.log('📱 Stream Chat push notification received:', event);
  
  if (!event.data) {
    console.log('⚠️ No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📨 Stream Chat push data:', data);

    // Handle different types of Stream Chat notifications
    let notificationOptions = {
      body: 'New message received',
      icon: NOTIFICATION_ICON,
      badge: '/icons/notification-badge.svg',
      tag: 'stream-chat-message',
      data: data,
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Open Chat',
          icon: '/icons/open-chat.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.svg'
        }
      ]
    };

    // Customize notification based on Stream Chat data
    if (data.type === 'message.new') {
      notificationOptions.body = `New message from ${data.user?.name || 'someone'}`;
      notificationOptions.tag = `stream-chat-${data.channel_id}`;
      
      if (data.message?.text) {
        notificationOptions.body = data.message.text.substring(0, 100);
        if (data.message.text.length > 100) {
          notificationOptions.body += '...';
        }
      }
    } else if (data.type === 'message.reply') {
      notificationOptions.body = `Reply from ${data.user?.name || 'someone'}`;
      notificationOptions.tag = `stream-chat-reply-${data.channel_id}`;
    } else if (data.type === 'reaction.new') {
      notificationOptions.body = `${data.user?.name || 'Someone'} reacted to your message`;
      notificationOptions.tag = `stream-chat-reaction-${data.channel_id}`;
    }

    // Show notification
    event.waitUntil(
      self.registration.showNotification('Stream Chat', notificationOptions)
    );

  } catch (error) {
    console.error('❌ Error processing Stream Chat push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('New Message', {
        body: 'You have a new message',
        icon: NOTIFICATION_ICON,
        tag: 'stream-chat-fallback'
      })
    );
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Stream Chat notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('🚫 Notification dismissed');
    return;
  }

  // Default action or 'open' action
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the app
        for (const client of clientList) {
          if (client.url.includes('/messages') && 'focus' in client) {
            client.focus();
            return;
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/messages');
        }
      })
      .catch((error) => {
        console.error('❌ Error handling notification click:', error);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🚪 Stream Chat notification closed:', event);
  
  // Track notification close for analytics
  if (event.notification.data) {
    console.log('📊 Notification closed:', event.notification.data);
  }
});

// Message event - handle communication from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Stream Chat Service Worker message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error event - handle service worker errors
self.addEventListener('error', (event) => {
  console.error('❌ Stream Chat Service Worker error:', event.error);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Stream Chat Service Worker unhandled rejection:', event.reason);
});

console.log('✅ Stream Chat Service Worker loaded successfully');
