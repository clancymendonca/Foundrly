# Foundrly Mobile App Setup

## Prerequisites

- Node.js 20+
- Expo dev client (USB debugging) or development build
- Foundrly web API running (`npm run dev` from repo root)

## Environment

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:

- `EXPO_PUBLIC_API_URL` — web API URL (e.g. `http://localhost:3000`; use `adb reverse tcp:3000 tcp:3000` for USB)
- `EXPO_PUBLIC_STREAM_API_KEY` — same as web `NEXT_PUBLIC_STREAM_API_KEY`
- `EXPO_PUBLIC_SANITY_PROJECT_ID` / `DATASET` — same as web
- `EXPO_PUBLIC_FIREBASE_*` — same Firebase project as web (Authentication enabled)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — OAuth 2.0 **Web** client ID from Google Cloud (required for native Google Sign-In)

## Firebase Auth

1. In [Firebase Console](https://console.firebase.google.com/) → Authentication → Sign-in method, enable **Google**, **Email/Password**, and **GitHub**.
2. For GitHub: add the OAuth callback URL shown in Firebase to your GitHub OAuth app.
3. Add Android app SHA-1 fingerprint in Firebase (Project Settings → Your apps) for Google Sign-In on device.
4. Copy the Web client ID into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

## Web backend

Add to `apps/web/.env.local` (see root `.env.example`):

```
AUTH_SECRET=...
MOBILE_JWT_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
```

## Run

```bash
# From repo root
npm install
npm run dev          # web API
npm run dev:mobile   # Expo
```

After adding `@react-native-google-signin/google-signin`, rebuild the native app:

```bash
cd apps/mobile
npx expo run:android
```

## USB debugging (Android)

```powershell
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```
