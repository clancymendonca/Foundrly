import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';

/** Firebase web app config from public env vars. */
export function getFirebaseWebConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * VAPID public key for FCM `getToken()`.
 * Must be the Web Push certificate from Firebase Console (Cloud Messaging),
 * not a custom web-push key used by the server-side web-push route.
 */
export function getFirebaseVapidKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || undefined;
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseWebConfig();
  return Boolean(
    cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.messagingSenderId &&
      cfg.appId
  );
}

export function ensureFirebaseApp() {
  if (getApps().length) return;
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }
  initializeApp(getFirebaseWebConfig());
}

export function isFcmRegistrationError(message: string): boolean {
  return (
    message.includes('token-subscribe-failed') ||
    message.includes('authentication credential') ||
    message.includes('Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY') ||
    message.includes('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY') ||
    message.includes('Firebase is not configured')
  );
}

export function formatFcmRegistrationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (isFcmRegistrationError(message)) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your Firebase project';
    return (
      'FCM token registration failed. Copy the Web Push public key from ' +
      'Firebase Console → Project Settings → Cloud Messaging → Web Push certificates ' +
      `into NEXT_PUBLIC_FIREBASE_VAPID_KEY (must match project ${projectId}). ` +
      'If your Firebase API key has HTTP referrer restrictions, add http://localhost:3000/*.'
    );
  }

  return message;
}
