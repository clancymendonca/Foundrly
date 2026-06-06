# Stream Chat Guide

How to set up and use Stream Chat features in Foundrly.

## Setup
### Environment variables
- `STREAM_API_KEY` (server)
- `STREAM_API_SECRET` (server)
- `NEXT_PUBLIC_STREAM_API_KEY` (client)
- `STREAM_WEBHOOK_SECRET` (webhooks)

### Webhook configuration
- Configure Stream Chat webhooks to point to `app/api/chat/moderation/route.ts`

### Push notifications
- Client hook: `hooks/useStreamChatPushNotifications.ts`
- Service worker: `public/sw-stream-chat.js`
- API routes: `app/api/stream-chat-push/route.ts`, `app/api/chat/upsert-user/route.ts`, `app/api/chat/token/route.ts`
