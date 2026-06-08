const DEFAULT_NOTIFICATION_TYPES: Record<string, boolean> = {
  like: true,
  dislike: true,
  comment: true,
  reply: true,
  follow: true,
  interested: true,
  comment_like: true,
};

/** Enable in-app notification preferences after the user grants browser permission. */
export function enableNotificationPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('notifications_enabled', 'true');

  if (!window.localStorage.getItem('notification_types_enabled')) {
    window.localStorage.setItem(
      'notification_types_enabled',
      JSON.stringify(DEFAULT_NOTIFICATION_TYPES)
    );
  }
}
