import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StreamChat } from "stream-chat";
import { ApiError, apiFetch } from "./api-client";
import { STREAM_API_KEY } from "./config";
import { useAuth } from "./auth-context";

export type StreamChatStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "banned";

interface StreamChatContextValue {
  client: StreamChat | null;
  status: StreamChatStatus;
  error: string | null;
  banDescription: string | null;
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
  }, [user?.id, user?.name, user?.image, retryCount, disconnect]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const value = useMemo(
    () => ({ client, status, error, banDescription, retry }),
    [client, status, error, banDescription, retry],
  );

  return (
    <StreamChatContext.Provider value={value}>
      {children}
    </StreamChatContext.Provider>
  );
}

export function useStreamChat() {
  const ctx = useContext(StreamChatContext);
  if (!ctx) {
    throw new Error("useStreamChat must be used within StreamChatProvider");
  }
  return ctx;
}
