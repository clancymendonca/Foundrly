import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getRedirectResult, signOut as firebaseSignOut } from "firebase/auth";
import type { SessionUser } from "@foundrly/shared";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { apiFetch, mobileFirebaseAuth, setAuthToken } from "./api-client";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

const TOKEN_KEY = "foundrly_auth_token";
const USER_KEY = "foundrly_auth_user";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);

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

  const exchangeFirebaseUser = useCallback(
    async (firebaseUser: { getIdToken: () => Promise<string> }) => {
      const idToken = await firebaseUser.getIdToken();
      const { token, user: sessionUser } = await mobileFirebaseAuth(idToken);
      await persistSession(token, sessionUser);
    },
    [persistSession],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (token && storedUser) {
          setAuthToken(token);
          setUser(JSON.parse(storedUser));
        }

        if (isFirebaseConfigured()) {
          try {
            const redirectResult = await Promise.race([
              getRedirectResult(getFirebaseAuth()),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000),
              ),
            ]);
            if (redirectResult?.user) {
              await exchangeFirebaseUser(redirectResult.user);
            }
          } catch {
            // Firebase redirect unavailable or misconfigured in dev
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exchangeFirebaseUser]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", async () => {
      try {
        const redirectResult = await getRedirectResult(getFirebaseAuth());
        if (redirectResult?.user) {
          await exchangeFirebaseUser(redirectResult.user);
          setLoginVisible(false);
        }
      } catch {}
    });
    return () => sub.remove();
  }, [exchangeFirebaseUser]);

  const signIn = useCallback(() => {
    setLoginVisible(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch {}
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginPanel
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onAuthenticated={exchangeFirebaseUser}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
