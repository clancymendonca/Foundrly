import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { StreamChat } from "stream-chat";
import { sanitizeStreamUserImage } from "@foundrly/shared";
import { ApiError, apiFetch } from "./api-client";
import { STREAM_API_KEY } from "./config";
import { useAuth } from "./auth-context";
import { theme } from "./theme";

export type StreamChatStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "banned"
  | "offline";

interface StreamChatContextValue {
  client: StreamChat | null;
  status: StreamChatStatus;
  error: string | null;
  banDescription: string | null;
  isOffline: boolean;
  retry: () => void;
}

const StreamChatContext = createContext<StreamChatContextValue | null>(null);

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [status, setStatus] = useState<StreamChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [banDescription, setBanDescription] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const clientRef = useRef<StreamChat | null>(null);

  const disconnect = useCallback(async () => {
    const existing = clientRef.current;
    clientRef.current = null;
    setClient(null);
    if (existing?.userID) {
      try {
        await existing.disconnectUser();
      } catch {
        // ignore disconnect errors
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      if (!offline && status === "offline") {
        setRetryCount((c) => c + 1);
      }
    });

    return () => unsubscribe();
  }, [status]);

  useEffect(() => {
    if (!user?.id) {
      disconnect();
      setStatus("idle");
      setError(null);
      setBanDescription(null);
      return;
    }

    if (!STREAM_API_KEY) {
      setStatus("error");
      setError(
        "Stream Chat is not configured. Add EXPO_PUBLIC_STREAM_API_KEY to apps/mobile/.env.",
      );
      return;
    }

    if (isOffline) {
      setStatus("offline");
      return;
    }

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);
      setBanDescription(null);

      try {
        await disconnect();

        const { token } = await apiFetch<{ token: string }>("/api/chat/token", {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });

        if (cancelled) return;

        const chatClient = StreamChat.getInstance(STREAM_API_KEY);
        await chatClient.connectUser(
          {
            id: user.id,
            name: user.name || user.id,
            image: sanitizeStreamUserImage(user.image),
          },
          token,
        );

        if (cancelled) {
          await chatClient.disconnectUser();
          return;
        }

        clientRef.current = chatClient;
        setClient(chatClient);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;

        if (e instanceof ApiError && e.status === 403) {
          setStatus("banned");
          setBanDescription(
            e.message || "Account is suspended. You cannot send messages.",
          );
          return;
        }

        setStatus("error");
        setError(
          e instanceof Error ? e.message : "Failed to connect to messages",
        );
      }
    })();

    return () => {
      cancelled = true;
      disconnect();
    };
  }, [user?.id, user?.name, user?.image, retryCount, disconnect, isOffline]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const value = useMemo(
    () => ({ client, status, error, banDescription, isOffline, retry }),
    [client, status, error, banDescription, isOffline, retry],
  );

  return (
    <StreamChatContext.Provider value={value}>
      {isOffline ? (
        <View style={bannerStyles.banner}>
          <Text style={bannerStyles.bannerText}>You are offline</Text>
          <Pressable onPress={retry}>
            <Text style={bannerStyles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {children}
    </StreamChatContext.Provider>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    backgroundColor: theme.gray700,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerText: {
    color: theme.white,
    fontFamily: theme.fontFamily.medium,
    fontSize: 13,
  },
  retryText: {
    color: theme.categoryTag,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 13,
  },
});

export function useStreamChat() {
  const ctx = useContext(StreamChatContext);
  if (!ctx) {
    throw new Error("useStreamChat must be used within StreamChatProvider");
  }
  return ctx;
}
