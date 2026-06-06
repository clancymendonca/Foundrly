# Push Notification Integration Guide

## Overview
This guide explains how to integrate push notifications into your existing components so that real user interactions trigger browser notifications.

## How It Works

### 1. Client-Side Notifications
- **Test Panel**: Uses `UnifiedPushNotificationService` directly (for testing)
- **Real Components**: Use `useClientNotifications` hook (for production)
 - **Stream Chat**: Use `useStreamChatPushNotifications` for chat push

### 2. Server-Side Notifications
- **API Routes**: Log notifications to console (for debugging)
- **Database**: Store notification data for persistence
 - **Push API**: `app/api/push-notifications/send/route.ts`

## Integration Steps

### Step 1: Import the Hook
```tsx
import { useClientNotifications } from '@/hooks/notifications/useClientNotifications';
import { useStreamChatPushNotifications } from '@/hooks/notifications/useStreamChatPushNotifications';
```

### Step 2: Use in Component
```tsx
const { showLikeNotification, showCommentNotification } = useClientNotifications();
```

### Step 3: Trigger Notifications
```tsx
// After successful API call
if (success && isNewAction) {
  await showLikeNotification(startupTitle, currentUserName);
}
```

## Component Examples

### Likes Component
```tsx
const { showLikeNotification } = useClientNotifications();

const handleLike = async () => {
  // ... existing API call logic ...
  
  // Show notification if this is a new like
  if (!previousLiked && data.likedBy?.includes(userId) && startupAuthorId !== userId) {
    await showLikeNotification(startupTitle, currentUserName);
  }
};
```

### Comments Component
```tsx
const { showCommentNotification } = useClientNotifications();

const handleComment = async () => {
  // ... existing API call logic ...
  
  // Show notification for new comment
  if (success && startupAuthorId !== userId) {
    await showCommentNotification(startupTitle, currentUserName, commentText);
  }
};
```

## Available Notification Types

### 1. Like Notifications
```tsx
showLikeNotification(startupTitle, likerName)
```

### 2. Dislike Notifications
```tsx
showDislikeNotification(startupTitle, dislikerName)
```

### 3. Comment Notifications
```tsx
showCommentNotification(startupTitle, commenterName, commentText)
```

### 4. Reply Notifications
```tsx
showReplyNotification(startupTitle, replierName, replyText)
```

### 5. Interest Notifications
```tsx
showInterestedNotification(startupTitle, interestedUserName)
```

### 6. Follow Notifications
```tsx
showFollowNotification(followerName)
```

### 7. Stream Chat Notifications
```tsx
const { registerForStreamChatPush, sendStreamChatNotification } = useStreamChatPushNotifications();
```

## Required Props

For components to show notifications, they need:

```tsx
interface ComponentProps {
  // Existing props...
  startupTitle?: string;        // Title of the startup
  startupAuthorId?: string;     // ID of startup owner
  currentUserName?: string;     // Name of current user
}
```

## Testing

### 1. Test Panel
- Go to Settings → Test All Notification Types
- Click "Test Client" buttons
- Should see browser notification popups

### 2. Real Components
- Go to Settings → Real Component Notifications
- Click any notification button
- Should see browser notification popups

### 3. Diagnostics
- Go to Settings → Notification Diagnostics
- Check browser support and permission status
 - Verify VAPID keys and service worker status

## Troubleshooting

### Notifications Not Showing
1. Check browser notification permission
2. Use "Clear All" button if too many notifications
3. Check console for errors
4. Use diagnostics tool for detailed analysis
 5. Verify required env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

### Permission Issues
1. Click "Enable Notifications" button
2. Check browser settings if permission denied
3. Refresh page after enabling

### Component Integration
1. Make sure to pass required props (startupTitle, startupAuthorId, currentUserName)
2. Check that notification is only shown for new actions (not un-doing actions)
3. Ensure startup author is not the same as current user

## Next Steps

1. **Update existing components** to include notification props
2. **Add notification hooks** to like, comment, follow components
3. **Test with real data** to ensure notifications work correctly
4. **Deploy and monitor** notification delivery

## Files to Update

- ✅ `components/StartupCard.tsx` - **COMPLETED** - Added notification props and hooks
- `components/CommentsSection.tsx` - Add comment/reply notifications
- `components/ActivityContentGrid.tsx` - Add like/dislike notifications
- Any other interaction components

## Example Integration

```tsx
// Before
const handleLike = async () => {
  const res = await fetch('/api/likes', { ... });
  // Update UI
};

// After
const { showLikeNotification } = useClientNotifications();

const handleLike = async () => {
  const previousLiked = liked;
  const res = await fetch('/api/likes', { ... });
  
  // Update UI
  setLiked(data.likedBy?.includes(userId));
  
  // Show notification
  if (!previousLiked && data.likedBy?.includes(userId) && startupAuthorId !== userId) {
    await showLikeNotification(startupTitle, currentUserName);
  }
};
```

This approach ensures that real user interactions trigger browser notifications while maintaining the existing functionality.
