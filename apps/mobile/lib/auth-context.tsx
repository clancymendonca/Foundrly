import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SessionUser } from "@foundrly/shared";
import { apiFetch, mobileGithubAuth, setAuthToken } from "./api-client";
import { APP_SCHEME, GITHUB_CLIENT_ID } from "./config";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "foundrly_auth_token";
const USER_KEY = "foundrly_auth_user";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback(async (token: string, sessionUser: SessionUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(sessionUser));
    setAuthToken(token);
    setUser(sessionUser);
  }, []);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (token && storedUser) {
          setAuthToken(token);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async () => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: APP_SCHEME });
    const authUrl =
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=read:user%20user:email`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success" || !result.url) {
      return;
    }

    const code = new URL(result.url).searchParams.get("code");
    if (!code) {
      throw new Error("No authorization code returned");
    }

    const { token, user: sessionUser } = await mobileGithubAuth(code, redirectUri);
    await persistSession(token, sessionUser);
  }, [persistSession]);

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    const profile = await apiFetch<SessionUser & { username?: string }>(
      `/api/user/${user.id}`,
    );
    const updated: SessionUser = {
      id: profile.id || user.id,
      name: profile.name ?? user.name,
      email: profile.email ?? user.email,
      image: profile.image ?? user.image,
    };
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
      setUser(updated);
    }
  }, [user]);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signOut, refreshUser }),
    [user, isLoading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
