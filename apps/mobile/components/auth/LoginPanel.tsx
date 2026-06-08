import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuthRequest } from "expo-auth-session";
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  exchangeGitHubCode,
  githubDiscovery,
  GITHUB_REDIRECT_URI,
  isGitHubOAuthConfigured,
} from "@/lib/github-oauth";
import { GOOGLE_WEB_CLIENT_ID } from "@/lib/config";
import { theme } from "@/lib/theme";

let googleConfigured = false;

function ensureGoogleConfigured() {
  if (googleConfigured || !GOOGLE_WEB_CLIENT_ID) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export function LoginPanel({
  visible,
  onClose,
  onAuthenticated,
}: {
  visible: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => Promise<void>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const githubCodeHandled = useRef<string | null>(null);

  const [githubRequest, githubResponse, promptGitHub] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "",
      scopes: ["read:user", "user:email"],
      redirectUri: GITHUB_REDIRECT_URI,
    },
    githubDiscovery,
  );

  const finish = async (action: () => Promise<User>) => {
    setError(null);
    setLoading(true);
    try {
      const user = await action();
      await onAuthenticated(user);
      onClose();
      router.replace("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setError(
        message.includes("redirect_uri")
          ? `GitHub redirect mismatch. Add this callback URL to your GitHub OAuth app: ${GITHUB_REDIRECT_URI}`
          : message.includes("Network request failed")
            ? "Cannot reach the API. Run npm run dev and adb reverse tcp:3000 tcp:3000."
            : message,
      );
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    if (githubResponse?.type !== "success" || !githubResponse.params.code) {
      if (githubResponse?.type === "error") {
        setError(githubResponse.error?.message || "GitHub sign-in failed");
        setLoading(false);
      }
      return;
    }

    const code = githubResponse.params.code;
    if (githubCodeHandled.current === code) return;
    githubCodeHandled.current = code;

    const codeVerifier = githubRequest?.codeVerifier;
    if (!codeVerifier) {
      setError("GitHub sign-in session expired. Please try again.");
      setLoading(false);
      return;
    }

    finish(async () => {
      const accessToken = await exchangeGitHubCode(code, codeVerifier);
      const credential = GithubAuthProvider.credential(accessToken);
      const result = await signInWithCredential(getFirebaseAuth(), credential);
      return result.user;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish on new OAuth code only
  }, [githubResponse]);

  const signInWithGoogle = async () => {
    ensureGoogleConfigured();
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured in apps/mobile/.env",
      );
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") {
      throw new Error("Google sign-in was cancelled");
    }
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const authResult = await signInWithCredential(getFirebaseAuth(), credential);
    return authResult.user;
  };

  const handleGitHub = async () => {
    if (!isGitHubOAuthConfigured()) {
      setError("EXPO_PUBLIC_GITHUB_CLIENT_ID is not configured");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await promptGitHub();
    } catch (e) {
      setError(e instanceof Error ? e.message : "GitHub sign-in failed");
      setLoading(false);
    }
  };

  const handleEmail = () =>
    finish(() => {
      const auth = getFirebaseAuth();
      return mode === "signin"
        ? signInWithEmailAndPassword(auth, email, password).then((r) => r.user)
        : createUserWithEmailAndPassword(auth, email, password).then(
            (r) => r.user,
          );
    });

  const providersReady = isFirebaseConfigured();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign in to Foundrly</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {!providersReady ? (
            <Text style={styles.error}>
              Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to
              apps/mobile/.env and restart Metro.
            </Text>
          ) : null}

          {!GOOGLE_WEB_CLIENT_ID ? (
            <Text style={styles.hint}>
              Google: add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to apps/mobile/.env
            </Text>
          ) : null}

          <Pressable
            style={styles.providerBtn}
            disabled={loading || !providersReady || !GOOGLE_WEB_CLIENT_ID}
            onPress={() => finish(signInWithGoogle)}
          >
            <Text style={styles.providerText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            style={styles.providerBtn}
            disabled={loading || !providersReady || !githubRequest}
            onPress={handleGitHub}
          >
            <Text style={styles.providerText}>Continue with GitHub</Text>
          </Pressable>

          {!isGitHubOAuthConfigured() ? (
            <Text style={styles.hint}>
              GitHub: add EXPO_PUBLIC_GITHUB_CLIENT_ID to apps/mobile/.env
            </Text>
          ) : null}

          <Text style={styles.divider}>or email</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.gray500}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.gray500}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.primaryBtn, loading && styles.disabled]}
            disabled={loading || !providersReady || !email || !password}
            onPress={handleEmail}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Text style={styles.primaryText}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            <Text style={styles.toggle}>
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.black,
  },
  close: { fontSize: 22, color: theme.gray600 },
  providerBtn: {
    borderWidth: 2,
    borderColor: theme.black,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: theme.white,
  },
  providerText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
  },
  hint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.gray500,
    textAlign: "center",
  },
  divider: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.white,
  },
  toggle: {
    textAlign: "center",
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.primary,
    marginTop: 4,
  },
  error: {
    color: theme.red600,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    textAlign: "center",
  },
  disabled: { opacity: 0.6 },
});
