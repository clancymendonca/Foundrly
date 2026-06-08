/**
 * Utility functions for moderation actions
 */

export const BAN_DURATIONS = {
  '1h': 60 * 60 * 1000, // 1 hour in milliseconds
  '24h': 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  '7d': 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  '365d': 365 * 24 * 60 * 60 * 1000, // 365 days in milliseconds
  'perm': null, // Permanent ban
} as const

export type BanDuration = keyof typeof BAN_DURATIONS

/**
 * Calculate the ban end date based on duration
 */
export function calculateBanEndDate(duration: BanDuration): Date | null {
  if (duration === 'perm') {
    return null // Permanent ban
  }
  
  const durationMs = BAN_DURATIONS[duration]
  if (!durationMs) {
    return null
  }
  
  return new Date(Date.now() + durationMs)
}

/**
 * Check if a ban has expired
 */
export function isBanExpired(bannedUntil: string | null): boolean {
  if (!bannedUntil) {
    return true // No ban
  }
  
  const banEndDate = new Date(bannedUntil)
  return Date.now() > banEndDate.getTime()
}

/**
 * Check if content/user is currently banned
 */
export function isCurrentlyBanned(bannedUntil: string | null, isBanned: boolean): boolean {
  if (!isBanned) {
    return false
  }
  
  if (!bannedUntil) {
    return isBanned // Permanent ban
  }
  
  return !isBanExpired(bannedUntil)
}

/**
 * Get ban status description
 */
export function getBanStatusDescription(bannedUntil: string | null, isBanned: boolean): string {
  if (!isBanned) {
    return 'Not banned'
  }
  
  if (!bannedUntil) {
    return 'Permanently banned'
  }
  
  if (isBanExpired(bannedUntil)) {
    return 'Ban expired'
  }
  
  const banEndDate = new Date(bannedUntil)
  const now = new Date()
  const diffMs = banEndDate.getTime() - now.getTime()
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 24) {
    return `Banned for ${diffHours} more hours`
  }
  
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `Banned for ${diffDays} more days`
}

/**
 * Apply ban to a document
 */
export async function applyBan(
  client: any,
  documentType: 'startup' | 'comment' | 'author',
  documentId: string,
  duration: BanDuration
): Promise<void> {
  const bannedUntil = calculateBanEndDate(duration)
  
  await client
    .patch(documentId)
    .set({
      isBanned: true,
      bannedUntil: bannedUntil ? bannedUntil.toISOString() : null,
    })
    .commit()
}

/**
 * Remove ban from a document
 */
export async function removeBan(
  client: any,
  documentType: 'startup' | 'comment' | 'author',
  documentId: string
): Promise<void> {
  await client
    .patch(documentId)
    .set({
      isBanned: false,
      bannedUntil: null,
    })
    .commit()
} 