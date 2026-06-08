"use client";

import React, { Suspense, useEffect } from 'react';
import { useBanCheck } from '@/hooks/moderation/use-ban-check';

interface BanCheckWrapperProps {
  children: (props: {
    isBanned: boolean;
    banMessage: string;
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
  fallback?: React.ReactNode;
}

function BanCheckContent({ children }: { children: BanCheckWrapperProps['children'] }) {
  const { isBanned, banMessage, isLoading, error, triggerCheck } = useBanCheck();
  
  // Trigger the check after mount
  useEffect(() => {
    triggerCheck();
  }, [triggerCheck]);
  
  return <>{children({ isBanned, banMessage, isLoading, error })}</>;
}

export function BanCheckWrapper({ children, fallback }: BanCheckWrapperProps) {
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <BanCheckContent>{children}</BanCheckContent>
    </Suspense>
  );
} 