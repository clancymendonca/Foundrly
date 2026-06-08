/* eslint-disable no-undef */
// Firebase Messaging SW for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
// Load Firebase web-app config from a static file you control
// Edit public/firebase-config.js and set self.__FIREBASE_CONFIG with your values
importScripts('/firebase-config.js');

if (!self.__FIREBASE_CONFIG) {
  // Fail fast with clear error if config isn't set correctly
  throw new Error('firebase-messaging-sw: Missing __FIREBASE_CONFIG. Create /public/firebase-config.js');
}

firebase.initializeApp(self.__FIREBASE_CONFIG);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New message';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/chat-notification.svg',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
