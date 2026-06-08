import { client } from '@/sanity/lib/client'
import { isCurrentlyBanned } from '@/sanity/lib/moderation'

export interface BanCheckResult {
  isBanned: boolean
  banReason?: string
  banEndDate?: string | null
  isPermanent: boolean
}

/**
 * Check if a user is currently banned
 */
export async function checkUserBanStatus(userId: string): Promise<BanCheckResult> {
  try {
    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{ 
        _id, 
        bannedUntil, 
        isBanned,
        banHistory 
      }`,
      { userId }
    )

    if (!user) {
      return {
        isBanned: false,
        isPermanent: false
      }
    }

    const isBanned = isCurrentlyBanned(user.bannedUntil, user.isBanned)
    
    return {
      isBanned,
      banEndDate: user.bannedUntil,
      isPermanent: user.isBanned && !user.bannedUntil,
      banReason: isBanned ? 'Account suspended due to violation of community guidelines' : undefined
    }
  } catch (error) {
    console.error('Error checking ban status:', error)
    return {
      isBanned: false,
      isPermanent: false
    }
  }
}

/**
 * Get ban status message for display
 */
export function getBanStatusMessage(banResult: BanCheckResult): string {
  if (!banResult.isBanned) {
    return ''
  }

  if (banResult.isPermanent) {
    return 'Your account has been permanently suspended. You cannot perform this action.'
  }

  if (banResult.banEndDate) {
    const endDate = new Date(banResult.banEndDate)
    const now = new Date()
    const diffMs = endDate.getTime() - now.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 24) {
      return `Your account is suspended for ${diffHours} more hours. You cannot perform this action.`
    }
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return `Your account is suspended for ${diffDays} more days. You cannot perform this action.`
  }

  return 'Your account is suspended. You cannot perform this action.'
}

/**
 * Check if user can perform an action (not banned)
 */
export async function canUserPerformAction(userId: string): Promise<{
  canPerform: boolean
  banResult: BanCheckResult
  message: string
}> {
  const banResult = await checkUserBanStatus(userId)
  const message = getBanStatusMessage(banResult)
  
  return {
    canPerform: !banResult.isBanned,
    banResult,
    message
  }
} 