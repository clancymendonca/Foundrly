# Stream Chat Guide

How to set up and use Stream Chat features in Foundrly.

## Setup

### Environment variables

- `STREAM_API_KEY` (server)
- `STREAM_API_SECRET` (server)
- `NEXT_PUBLIC_STREAM_API_KEY` (client)
- `EXPO_PUBLIC_STREAM_API_KEY` (mobile)
- `STREAM_WEBHOOK_SECRET` (webhooks)

### Webhook configuration

- Configure Stream Chat webhooks to point to `app/api/chat/moderation/route.ts`

### Push notifications

- **Web:** `hooks/useStreamChatPushNotifications.ts`, `public/sw-stream-chat.js`, `app/api/stream-chat-push/route.ts`
- **Mobile:** `hooks/use-stream-chat-push.ts`, `lib/notifications.ts`, `app/api/chat/register-device/route.ts`
- Device registration uses Expo push tokens with Stream `addDevice` (fallback via backend route)

## Mobile feature matrix (custom UI)

| Feature | Status | Primary files |
|---------|--------|---------------|
| 1:1 messaging | Done | `ChatThread.tsx`, `MessagesInbox.tsx` |
| Conversation details layer | Done | `ChatConversationDetails.tsx` |
| Attachments (send/display) | Done | `AttachmentPicker.tsx`, `chat-attachments.ts` |
| Typing indicators | Done | `use-typing-indicator.ts`, `TypingIndicator.tsx` |
| Online presence | Done | `use-peer-presence.ts`, `ChatAvatar.tsx` |
| Read receipts | Done | `MessageBubble.tsx` |
| Replies (`parent_id`) | Done | `ChatComposer.tsx`, `MessageBubble.tsx` |
| Edit / delete | Done | `MessageActionsSheet.tsx` |
| Message pagination | Done | `use-channel-messages.ts` |
| Push + deep link | Done | `use-stream-chat-push.ts`, `_layout` notification listener |
| Profile → Message | Done | `ProfileMessageButton.tsx` |
| Offline reconnect | Done | `stream-chat-context.tsx` + NetInfo |
| Inbox relative time | Done | `format-chat-time.ts`, `chat-utils.ts` |

## Architecture

Mobile uses the **raw `stream-chat` SDK** with custom UI (not `stream-chat-expo` prebuilt components).

Key modules:

- `hooks/use-channel-messages.ts` — channel watch, events, pagination
- `components/chat/MessageBubble.tsx` — rendering
- `components/chat/ChatComposer.tsx` — input, reply/edit banners
- `components/chat/ChatConversationDetails.tsx` — Instagram-style details sheet (Foundrly branding)

## API routes

- `POST /api/chat/token` — user token
- `POST /api/chat/upsert-user` — sync user to Stream
- `POST /api/chat/create-channel` — create 1:1 channel
- `POST /api/chat/ensure-channel-access` — membership guard
- `POST /api/chat/register-device` — mobile push device registration
- `POST /api/moderation/check` — pre-send moderation (mobile + web)
