import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // '7d', '30d', '90d', '1y', 'all'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Calculate date range
    let dateFilter = ''
    const now = new Date()
    
    if (startDate && endDate) {
      dateFilter = ` && bannedAt >= "${startDate}" && bannedAt <= "${endDate}"`
    } else {
      let startDateObj: Date
      switch (period) {
        case '7d':
          startDateObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDateObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDateObj = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDateObj = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default: // 'all'
          startDateObj = new Date(0)
      }
      dateFilter = ` && bannedAt >= "${startDateObj.toISOString()}"`
    }

    // Get all banned users with their ban history
    const users = await client.fetch(
      `*[_type == "author" && (isBanned == true || count(banHistory) > 0)${dateFilter}]{
        _id,
        name,
        email,
        bannedUntil,
        isBanned,
        strikeCount,
        banHistory[]{
          reason,
          bannedUntil,
          bannedAt,
          bannedBy,
          isPermanent,
          strikeCount
        }
      }`
    )

    // Calculate analytics
    const analytics = calculateBanAnalytics(users, period)

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate || (period !== 'all' ? new Date(now.getTime() - getPeriodDays(period) * 24 * 60 * 60 * 1000).toISOString() : null),
        end: endDate || now.toISOString()
      },
      analytics
    })
  } catch (error) {
    console.error('Error fetching ban analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateBanAnalytics(users: any[], period: string) {
  const totalUsers = users.length
  const currentlyBanned = users.filter(u => u.isBanned).length
  const permanentlyBanned = users.filter(u => u.isBanned && !u.bannedUntil).length
  const temporarilyBanned = currentlyBanned - permanentlyBanned

  // Calculate total bans (including historical)
  const totalBans = users.reduce((sum, user) => sum + (user.banHistory?.length || 0), 0)
  
  // Calculate average strikes
  const totalStrikes = users.reduce((sum, user) => sum + (user.strikeCount || 0), 0)
  const averageStrikes = totalUsers > 0 ? totalStrikes / totalUsers : 0

  // Group by ban reasons
  const banReasons = new Map()
  users.forEach(user => {
    user.banHistory?.forEach((ban: any) => {
      const reason = ban.reason || 'Unknown'
      banReasons.set(reason, (banReasons.get(reason) || 0) + 1)
    })
  })

  // Calculate daily ban trends
  const dailyBans = new Map()
  users.forEach(user => {
    user.banHistory?.forEach((ban: any) => {
      if (ban.bannedAt) {
        const date = ban.bannedAt.split('T')[0]
        dailyBans.set(date, (dailyBans.get(date) || 0) + 1)
      }
    })
  })

  // Calculate ban duration statistics
  const banDurations: number[] = []
  users.forEach(user => {
    user.banHistory?.forEach((ban: any) => {
      if (ban.bannedAt && ban.bannedUntil && !ban.isPermanent) {
        const start = new Date(ban.bannedAt)
        const end = new Date(ban.bannedUntil)
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        banDurations.push(durationHours)
      }
    })
  })

  const averageBanDuration = banDurations.length > 0 
    ? banDurations.reduce((sum, duration) => sum + duration, 0) / banDurations.length 
    : 0

  return {
    overview: {
      totalUsers,
      currentlyBanned,
      permanentlyBanned,
      temporarilyBanned,
      totalBans,
      averageStrikes: Math.round(averageStrikes * 100) / 100
    },
    banReasons: Array.from(banReasons.entries()).map(([reason, count]) => ({
      reason,
      count
    })).sort((a, b) => b.count - a.count),
    dailyTrends: Array.from(dailyBans.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date,
        count
      })),
    durationStats: {
      averageHours: Math.round(averageBanDuration * 100) / 100,
      totalBansWithDuration: banDurations.length,
      shortestBan: banDurations.length > 0 ? Math.min(...banDurations) : 0,
      longestBan: banDurations.length > 0 ? Math.max(...banDurations) : 0
    },
    strikeDistribution: {
      zeroStrikes: users.filter(u => (u.strikeCount || 0) === 0).length,
      oneStrike: users.filter(u => (u.strikeCount || 0) === 1).length,
      twoStrikes: users.filter(u => (u.strikeCount || 0) === 2).length,
      threePlusStrikes: users.filter(u => (u.strikeCount || 0) >= 3).length
    }
  }
}

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '1y': return 365
    default: return 0
  }
} 