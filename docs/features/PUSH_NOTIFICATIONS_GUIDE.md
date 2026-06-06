# Push Notifications Guide

How to set up and use push notifications in Foundrly.

## Setup
- Register service worker
- Configure VAPID keys
- Set environment variables
- Test push delivery

### Environment Variables
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL` (optional, defaults to noreply)

### Service Workers
- Browser push: `public/sw.js`
- Stream Chat push: `public/sw-stream-chat.js`

### API Routes
- Browser push send: `app/api/push-notifications/send/route.ts`

### Client Hooks
- `hooks/usePushNotifications.ts` (unified browser push)
- `hooks/useStreamChatPushNotifications.ts` (Stream Chat)