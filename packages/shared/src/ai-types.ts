export interface PitchAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingElements: string[];
  marketInsights: {
    marketSize?: string;
    competition?: string;
    trends?: string;
  };
  category: string;
  tags: string[];
  confidence?: number;
}

export interface GeneratedStartupContent {
  title: string;
  description: string;
  pitch: string;
  tags: string[];
  marketAnalysis: string;
  features: string[];
  targetAudience: string[];
}

export interface PitchScoreTheme {
  label: string;
  textColor: string;
  badgeBg: string;
}

export function getPitchScoreTheme(score: number): PitchScoreTheme {
  if (score >= 8) {
    return {
      label: "Excellent",
      textColor: "#16A34A",
      badgeBg: "#DCFCE7",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      textColor: "#CA8A04",
      badgeBg: "#FEF9C3",
    };
  }
  return {
    label: "Needs Improvement",
    textColor: "#DC2626",
    badgeBg: "#FEE2E2",
  };
}

export function getPitchScoreTailwind(score: number): {
  label: string;
  textClass: string;
  badgeClass: string;
} {
  if (score >= 8) {
    return {
      label: "Excellent",
      textClass: "text-green-600",
      badgeClass: "bg-green-100 text-green-800",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      textClass: "text-yellow-600",
      badgeClass: "bg-yellow-100 text-yellow-800",
    };
  }
  return {
    label: "Needs Improvement",
    textClass: "text-red-600",
    badgeClass: "bg-red-100 text-red-800",
  };
}

export function extractGeneratedPitch(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const content = record.content as Record<string, unknown> | string | undefined;

  if (content && typeof content === "object" && typeof content.pitch === "string") {
    return content.pitch;
  }
  if (typeof record.pitch === "string") return record.pitch;
  if (typeof content === "string") return content;

  if (content && typeof content === "object" && typeof content.description === "string") {
    const match = content.description.match(/```json\n([\s\S]*?)\n```/);
    if (match?.[1]) {
      try {
        const parsed = JSON.parse(match[1]) as { pitch?: string };
        if (parsed.pitch) return parsed.pitch;
      } catch {
        const pitchMatch = match[1].match(/"pitch"\s*:\s*"([\s\S]*?)"\s*,/);
        if (pitchMatch?.[1]) {
          return pitchMatch[1].replace(/\\n/g, "\n");
        }
      }
    }
  }

  return "";
}

export function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("too many requests");
}

export function formatAiErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  if (isRateLimitError(message)) {
    return "AI is busy right now. Please wait a minute and try again.";
  }
  return message || fallback;
}
