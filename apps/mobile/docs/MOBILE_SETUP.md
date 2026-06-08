# Foundrly Mobile App Setup

## Prerequisites

- Node.js 20+
- Expo Go app on your device (development)
- Foundrly web API running (`npm run dev` from repo root)

## Environment

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:

- `EXPO_PUBLIC_API_URL` — web API URL (e.g. `http://localhost:3000` or your machine IP for physical devices)
- `EXPO_PUBLIC_STREAM_API_KEY` — same as web `NEXT_PUBLIC_STREAM_API_KEY`
- `EXPO_PUBLIC_SANITY_PROJECT_ID` / `DATASET` — same as web
- `EXPO_PUBLIC_GITHUB_CLIENT_ID` — GitHub OAuth app client ID

## GitHub OAuth (mobile)

1. Create or update your GitHub OAuth app at https://github.com/settings/developers
2. Add authorization callback URL: `foundrly://` (matches `scheme` in `app.json`)
3. For Expo development, also add the redirect URI printed by `expo-auth-session` (run app once and check logs)

## Web backend

Add to `apps/web/.env.local`:

```
MOBILE_JWT_SECRET=<random-32-char-secret>
```

## Run

```bash
# From repo root
npm install
npm run dev          # web API
npm run dev:mobile   # Expo
```

## EAS Build (production)

```bash
cd apps/mobile
npx eas build --platform all
```

## Push notifications

- Uses `expo-notifications` with FCM/APNs via EAS
- Call `registerForPushNotifications()` after login (see `lib/notifications.ts`)
- Production requires EAS development/production builds (not Expo Go)
