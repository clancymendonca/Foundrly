"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase-auth-client";

type LoginPanelProps = {
  onSuccess?: () => void;
  className?: string;
};

export default function LoginPanel({ onSuccess, className = "" }: LoginPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const completeLogin = async (getUser: () => Promise<{ getIdToken: () => Promise<string> }>) => {
    setError(null);
    setLoading(true);
    try {
      const user = await getUser();
      const idToken = await user.getIdToken();
      const result = await signIn("firebase", {
        idToken,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      onSuccess?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    await completeLogin(() =>
      mode === "signin"
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password),
    );
  };

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => completeLogin(signInWithGoogle)}
          className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 font-medium hover:bg-primary-100 transition-colors disabled:opacity-60"
        >
          Continue with Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => completeLogin(signInWithGitHub)}
          className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 font-medium hover:bg-primary-100 transition-colors disabled:opacity-60"
        >
          Continue with GitHub
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <div className="h-px flex-1 bg-gray-200" />
        <span>or email</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-4 py-3"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-4 py-3"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="w-full text-sm text-primary font-medium"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
