import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import {
  extractGeneratedPitch,
  formatAiErrorMessage,
  type PitchAnalysis,
} from "@foundrly/shared";
import { apiFetch } from "@/lib/api-client";

interface UsePitchAiOptions {
  title: string;
  description: string;
  category: string;
  pitch: string;
  onPitchChange: (pitch: string) => void;
  onAnalysisComplete?: () => void;
}

export function usePitchAi({
  title,
  description,
  category,
  pitch,
  onPitchChange,
  onAnalysisComplete,
}: UsePitchAiOptions) {
  const [aiLoading, setAiLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);
  const [analyzedPitchSnapshot, setAnalyzedPitchSnapshot] = useState<
    string | null
  >(null);
  const generateInFlight = useRef(false);

  const canGenerate = Boolean(title.trim() && description.trim());
  const canAnalyze = Boolean(title.trim() && pitch.trim());
  const isAnalysisStale =
    pitchAnalysis !== null &&
    analyzedPitchSnapshot !== null &&
    pitch !== analyzedPitchSnapshot;

  const applyGeneratedPitch = useCallback(
    (generatedPitch: string) => {
      onPitchChange(generatedPitch);
      setPitchAnalysis(null);
      setAnalyzedPitchSnapshot(null);
      Toast.show({
        type: "success",
        text1: "AI Pitch Generated",
        text2: "You can edit or submit this pitch.",
      });
    },
    [onPitchChange],
  );

  const runGenerate = useCallback(async () => {
    if (generateInFlight.current) return;
    generateInFlight.current = true;
    setAiLoading(true);
    setAiError(null);

    try {
      if (!canGenerate) {
        Toast.show({
          type: "error",
          text1: "Notice",
          text2: "Please fill in both title and description fields.",
        });
        return;
      }

      const data = await apiFetch<Record<string, unknown>>(
        "/api/ai/generate-content",
        {
          method: "POST",
          body: JSON.stringify({ title, description, category }),
        },
      );

      if (!data.success) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "AI generation failed",
        );
      }

      const generatedPitch = extractGeneratedPitch(data);
      if (!generatedPitch) {
        throw new Error("AI did not return pitch content");
      }

      applyGeneratedPitch(generatedPitch);
    } catch (e) {
      const message = formatAiErrorMessage(e, "Failed to generate pitch");
      setAiError(message);
      Toast.show({ type: "error", text1: message });
    } finally {
      setAiLoading(false);
      generateInFlight.current = false;
    }
  }, [applyGeneratedPitch, canGenerate, category, description, title]);

  const handleGeneratePitch = useCallback(() => {
    if (!canGenerate) {
      Toast.show({
        type: "error",
        text1: "Notice",
        text2: "Please fill in both title and description fields.",
      });
      return;
    }

    if (pitch.trim()) {
      Alert.alert(
        "Replace existing pitch?",
        "Generating a new pitch will replace what you have written.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace", style: "destructive", onPress: runGenerate },
        ],
      );
      return;
    }

    void runGenerate();
  }, [canGenerate, pitch, runGenerate]);

  const handleAnalyzePitch = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      if (!canAnalyze) {
        const message = "Please provide both title and pitch content.";
        setAnalysisError(message);
        Toast.show({ type: "error", text1: "Notice", text2: message });
        return;
      }

      const data = await apiFetch<{
        success: boolean;
        message?: string;
        analysis?: PitchAnalysis;
      }>("/api/ai/pitch-analysis", {
        method: "POST",
        body: JSON.stringify({ pitch, title, category }),
      });

      if (!data.success || !data.analysis) {
        throw new Error(data.message || "AI analysis failed");
      }

      setPitchAnalysis(data.analysis);
      setAnalyzedPitchSnapshot(pitch);
      Toast.show({
        type: "success",
        text1: "Pitch Analysis Complete",
        text2: "See feedback below.",
      });
      onAnalysisComplete?.();
    } catch (e) {
      const message = formatAiErrorMessage(e, "Failed to analyze pitch");
      setAnalysisError(message);
      Toast.show({ type: "error", text1: message });
    } finally {
      setIsAnalyzing(false);
    }
  }, [canAnalyze, category, onAnalysisComplete, pitch, title]);

  return {
    aiLoading,
    isAnalyzing,
    aiError,
    analysisError,
    pitchAnalysis,
    isAnalysisStale,
    canGenerate,
    canAnalyze,
    handleGeneratePitch,
    handleAnalyzePitch,
  };
}
