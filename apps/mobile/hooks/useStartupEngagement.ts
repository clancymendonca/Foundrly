import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/lib/api-client";

type EngagementState = {
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  saved: boolean;
  interested: boolean;
  views: number;
  initialLoading: boolean;
  likeLoading: boolean;
  dislikeLoading: boolean;
  saveLoading: boolean;
};

export function useStartupEngagement(startupId: string, userId?: string) {
  const [state, setState] = useState<EngagementState>({
    likes: 0,
    dislikes: 0,
    liked: false,
    disliked: false,
    saved: false,
    interested: false,
    views: 0,
    initialLoading: true,
    likeLoading: false,
    dislikeLoading: false,
    saveLoading: false,
  });
  const hasIncremented = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const emptyLikes = {
          likes: 0,
          likedBy: [] as string[],
          dislikes: 0,
          dislikedBy: [] as string[],
        };
        const emptyDislikes = {
          dislikes: 0,
          dislikedBy: [] as string[],
          likes: 0,
          likedBy: [] as string[],
        };

        const [likesRes, dislikesRes, savedRes, interestedRes, viewsRes] =
          await Promise.all([
            apiFetch<typeof emptyLikes>(`/api/likes?id=${startupId}`).catch(
              () => emptyLikes,
            ),
            apiFetch<typeof emptyDislikes>(`/api/dislikes?id=${startupId}`).catch(
              () => emptyDislikes,
            ),
            apiFetch<{ savedBy: string[] }>(`/api/saved?id=${startupId}`).catch(
              () => ({ savedBy: [] as string[] }),
            ),
            apiFetch<{ interestedBy: string[] }>(
              `/api/interested?id=${startupId}`,
            ).catch(() => ({ interestedBy: [] as string[] })),
            apiFetch<{ views: number }>(`/api/views?id=${startupId}`).catch(
              () => ({ views: 0 }),
            ),
          ]);

        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          likes: likesRes.likes ?? 0,
          dislikes: dislikesRes.dislikes ?? 0,
          liked: userId
            ? (likesRes.likedBy ?? []).includes(userId)
            : false,
          disliked: userId
            ? (dislikesRes.dislikedBy ?? []).includes(userId)
            : false,
          saved: userId
            ? (savedRes.savedBy ?? []).includes(userId)
            : false,
          interested: userId
            ? (interestedRes.interestedBy ?? []).includes(userId)
            : false,
          views: viewsRes.views ?? 0,
          initialLoading: false,
        }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, initialLoading: false }));
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [startupId, userId]);

  useEffect(() => {
    const incrementViews = async () => {
      if (hasIncremented.current) return;
      const key = `viewed_${startupId}`;
      const viewed = await AsyncStorage.getItem(key);
      if (viewed) {
        hasIncremented.current = true;
        return;
      }
      try {
        const data = await apiFetch<{ success?: boolean; views: number }>(
          `/api/views?id=${startupId}`,
          { method: "POST" },
        );
        if (data.success) {
          setState((prev) => ({ ...prev, views: data.views }));
          hasIncremented.current = true;
          await AsyncStorage.setItem(key, "true");
        }
      } catch {}
    };
    incrementViews();
  }, [startupId]);

  const toggleLike = useCallback(async () => {
    if (!userId || state.likeLoading) return;
    setState((prev) => ({ ...prev, likeLoading: true }));
    try {
      const data = await apiFetch<{
        likes: number;
        dislikes: number;
        likedBy: string[];
        dislikedBy: string[];
      }>(`/api/likes?id=${startupId}`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setState((prev) => ({
        ...prev,
        likes: data.likes ?? prev.likes,
        dislikes: data.dislikes ?? prev.dislikes,
        liked: data.likedBy?.includes(userId) ?? false,
        disliked: data.dislikedBy?.includes(userId) ?? false,
        likeLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, likeLoading: false }));
    }
  }, [startupId, userId, state.likeLoading]);

  const toggleDislike = useCallback(async () => {
    if (!userId || state.dislikeLoading) return;
    setState((prev) => ({ ...prev, dislikeLoading: true }));
    try {
      const data = await apiFetch<{
        likes: number;
        dislikes: number;
        likedBy: string[];
        dislikedBy: string[];
      }>(`/api/dislikes?id=${startupId}`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setState((prev) => ({
        ...prev,
        likes: data.likes ?? prev.likes,
        dislikes: data.dislikes ?? prev.dislikes,
        liked: data.likedBy?.includes(userId) ?? false,
        disliked: data.dislikedBy?.includes(userId) ?? false,
        dislikeLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, dislikeLoading: false }));
    }
  }, [startupId, userId, state.dislikeLoading]);

  const toggleSave = useCallback(async () => {
    if (!userId || state.saveLoading) return;
    setState((prev) => ({ ...prev, saveLoading: true }));
    try {
      const data = await apiFetch<{ success?: boolean; saved: boolean }>(
        `/api/saved?id=${startupId}`,
        { method: "POST" },
      );
      if (data.success) {
        setState((prev) => ({ ...prev, saved: data.saved, saveLoading: false }));
      } else {
        setState((prev) => ({ ...prev, saveLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, saveLoading: false }));
    }
  }, [startupId, userId, state.saveLoading]);

  return { ...state, toggleLike, toggleDislike, toggleSave };
}
