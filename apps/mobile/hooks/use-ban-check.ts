import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export interface BanStatus {
  isBanned: boolean;
  banReason?: string;
  banEndDate?: string | null;
  isPermanent: boolean;
  message: string;
}

const defaultStatus: BanStatus = {
  isBanned: false,
  isPermanent: false,
  message: "",
};

export function useBanCheck(userId: string | undefined) {
  const [banStatus, setBanStatus] = useState<BanStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(false);

  const checkBanStatus = useCallback(async () => {
    if (!userId) {
      setBanStatus(defaultStatus);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiFetch<BanStatus>(`/api/user/${userId}/ban-status`);
      setBanStatus(data);
    } catch {
      setBanStatus(defaultStatus);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkBanStatus();
  }, [checkBanStatus]);

  return { banStatus, isLoading, checkBanStatus };
}
