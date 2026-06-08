import { calculateBanEndDate } from './moderation'

export interface BanHistoryEntry {
  timestamp: string
  duration: string
  reason?: string
  reportId?: string
  strikeNumber: number
}

export interface StrikeSystemResult {
  shouldBan: boolean
  banDuration: string
  strikeNumber: number
  isPermanent: boolean
  reason: string
}

/**
 * Determines the appropriate ban duration and strike number based on current strike count
 */
export function calculateStrikeBan(currentStrikeCount: number, requestedDuration: string): StrikeSystemResult {
  const newStrikeCount = currentStrikeCount + 1
  
  // If this is the 3rd strike, always make it permanent
  if (newStrikeCount >= 3) {
    return {
      shouldBan: true,
      banDuration: 'perm',
      strikeNumber: 3,
      isPermanent: true,
      reason: '3rd strike - automatic permanent ban'
    }
  }
  
  // For 1st and 2nd strikes, use the requested duration
  return {
    shouldBan: true,
    banDuration: requestedDuration,
    strikeNumber: newStrikeCount,
    isPermanent: requestedDuration === 'perm',
    reason: `Strike ${newStrikeCount} of 3`
  }
}

/**
 * Creates a ban history entry
 */
export function createBanHistoryEntry(
  duration: string,
  reason: string,
  reportId?: string,
  strikeNumber: number = 1
): BanHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    duration,
    reason,
    reportId,
    strikeNumber
  }
}

/**
 * Checks if a user should be automatically unbanned based on ban expiration
 */
export function shouldUnbanUser(bannedUntil: string | null, isBanned: boolean): boolean {
  if (!isBanned || !bannedUntil) {
    return false
  }
  
  const now = new Date()
  const banEnd = new Date(bannedUntil)
  
  return now >= banEnd
}

/**
 * Gets the current strike count from ban history
 */
export function getCurrentStrikeCount(banHistory: BanHistoryEntry[]): number {
  if (!banHistory || banHistory.length === 0) {
    return 0
  }
  
  // Count only non-permanent bans that have expired
  const now = new Date()
  const activeStrikes = banHistory.filter(entry => {
    if (entry.duration === 'perm') {
      return true // Permanent bans count as active strikes
    }
    
    const banEnd = calculateBanEndDate(entry.duration as any)
    return banEnd && now < banEnd
  })
  
  return activeStrikes.length
}

/**
 * Gets a summary of the user's ban status
 */
export function getBanSummary(
  isBanned: boolean,
  bannedUntil: string | null,
  strikeCount: number,
  banHistory: BanHistoryEntry[]
): {
  isCurrentlyBanned: boolean
  currentStrikes: number
  nextStrikeAction: string
  banHistory: BanHistoryEntry[]
} {
  const currentStrikes = getCurrentStrikeCount(banHistory)
  
  let nextStrikeAction = 'No action needed'
  if (currentStrikes === 0) {
    nextStrikeAction = 'Next violation: 1st strike'
  } else if (currentStrikes === 1) {
    nextStrikeAction = 'Next violation: 2nd strike'
  } else if (currentStrikes === 2) {
    nextStrikeAction = 'Next violation: PERMANENT BAN'
  } else {
    nextStrikeAction = 'User is permanently banned'
  }
  
  return {
    isCurrentlyBanned: isBanned && bannedUntil ? new Date() < new Date(bannedUntil) : isBanned,
    currentStrikes,
    nextStrikeAction,
    banHistory: banHistory || []
  }
} 