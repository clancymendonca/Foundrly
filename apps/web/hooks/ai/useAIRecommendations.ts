'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface RecommendationResult {
  startups: any[];
  reasons: string[];
  confidence: number;
}

interface UseAIRecommendationsReturn {
  recommendations: RecommendationResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAIRecommendations(
  limit: number = 10,
  options?: { enabled?: boolean }
): UseAIRecommendationsReturn {
  const enabled = options?.enabled ?? true;
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/recommendations?limit=${limit}`);
      const data = await response.json();

      if (response.status === 401) {
        setRecommendations(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }

      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recommendations');
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setRecommendations(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    fetchRecommendations();
  }, [limit, enabled]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations
  };
}

