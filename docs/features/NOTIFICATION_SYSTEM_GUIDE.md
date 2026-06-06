# Foundrly Notification System Guide

A guide to the notification system, including notification types, triggers, and UI components.

## Overview
- Real-time updates for user activities
- Multi-channel support: in-app, email, push
- Filtering, pagination, mark as read

Key modules:
- Client hooks: `hooks/useNotifications.ts`, `hooks/useClientNotifications.ts`, `hooks/useRealtimeNotifications.ts`
- Server: `lib/notifications.ts` (or `lib/emailNotifications.ts`, `lib/pushNotifications.ts`)
- API routes: `app/api/notifications/*`

## Notification Types
- Social interactions: follow, like, comment, reply, mention
- Content engagement: views, shares, badge earned
- System notifications: welcome, update, reminder

## UI Components
- Notification bell, dropdown, full management page

Environment variables (for email/push channels):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- Email SMTP as configured in `EMAIL_SETUP_GUIDE.md`
