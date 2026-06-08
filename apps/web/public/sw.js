// Service Worker for Push Notifications
const CACHE_NAME = 'foundrly-push-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache opened');
        return cache.addAll([
          '/',
          '/notifications',
          '/icons/notification.svg',
          '/icons/follow.svg',
          '/icons/comment.svg',
          '/icons/like.svg',
          '/icons/moderation.svg'
        ]);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
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
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  if (!event.data) {
    console.log('⚠️ No data in push event');
    return;
  }

  try {
    const notification = event.data.json();
    console.log('📋 Notification data:', notification);

    // Detect mobile device for enhanced notification options
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const options = {
      body: notification.body,
      icon: notification.icon || '/icons/notification.svg',
      badge: notification.badge || '/icons/notification.svg',
      tag: notification.tag || 'general',
      data: notification.data || {},
      requireInteraction: notification.requireInteraction || isMobile, // Keep visible longer on mobile
      silent: notification.silent || false,
      actions: notification.actions || [],
      vibrate: isMobile ? [200, 100, 200] : undefined, // Only vibrate on mobile
      timestamp: Date.now(),
      // iOS-specific options
      ...(isIOS && {
        renotify: true
      })
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );

  } catch (error) {
    console.error('❌ Error processing push notification:', error);
    
    // Fallback notification
    const options = {
      body: 'You have a new notification',
              icon: '/icons/notification.svg',
        badge: '/icons/notification.svg',
      tag: 'fallback'
    };

    event.waitUntil(
      self.registration.showNotification('Foundrly', options)
    );
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Handle view action
    const url = event.notification.data?.url || '/notifications';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else {
    // Default click behavior - open notifications page
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event);
  
  // You can track notification engagement here
  const notification = event.notification;
  console.log('📊 Notification closed:', {
    title: notification.title,
    tag: notification.tag,
    data: notification.data
  });
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('🔄 Processing background sync...')
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received in service worker:', event);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback to cached version if network fails
          return caches.match('/');
        })
    );
  }
}); 