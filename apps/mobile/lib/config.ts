import Constants from "expo-constants";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || "";

export const SANITY_PROJECT_ID =
  process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || "";

export const SANITY_DATASET =
  process.env.EXPO_PUBLIC_SANITY_DATASET || "production";

export const SANITY_API_VERSION =
  process.env.EXPO_PUBLIC_SANITY_API_VERSION || "2025-01-02";

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

export const GITHUB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "";

export const APP_SCHEME =
  Constants.expoConfig?.scheme?.toString() || "foundrly";
