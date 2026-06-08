import { useMemo } from 'react'
import { isCurrentlyBanned, getBanStatusDescription } from '@/sanity/lib/moderation'

interface UseBanStatusProps {
  bannedUntil: string | null
  isBanned: boolean
}

export function useBanStatus({ bannedUntil, isBanned }: UseBanStatusProps) {
  const banStatus = useMemo(() => {
    const isBannedUser = isCurrentlyBanned(bannedUntil, isBanned)
    const description = getBanStatusDescription(bannedUntil, isBanned)
    
    return {
      isBanned: isBannedUser,
      description,
      bannedUntil,
      isPermanent: bannedUntil === null && isBanned,
    }
  }, [bannedUntil, isBanned])

  return banStatus
} 