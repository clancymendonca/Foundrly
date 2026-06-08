import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // 'active', 'expired', 'permanent'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Build the query
    let query = `*[_type == "author" && (isBanned == true || count(banHistory) > 0)]`
    let params: any = {}

    // Add search filter
    if (search) {
      query += ` && (name match "*${search}*" || email match "*${search}*")`
    }

    // Add status filter
    if (status) {
      const now = new Date().toISOString()
      switch (status) {
        case 'active':
          query += ` && (isBanned == true && (bannedUntil == null || bannedUntil > "${now}"))`
          break
        case 'expired':
          query += ` && (isBanned == true && bannedUntil != null && bannedUntil <= "${now}")`
          break
        case 'permanent':
          query += ` && (isBanned == true && bannedUntil == null)`
          break
      }
    }

    // Add date range filter
    if (startDate || endDate) {
      if (startDate && endDate) {
        query += ` && bannedAt >= "${startDate}" && bannedAt <= "${endDate}"`
      } else if (startDate) {
        query += ` && bannedAt >= "${startDate}"`
      } else if (endDate) {
        query += ` && bannedAt <= "${endDate}"`
      }
    }

    // Add sorting and pagination
    query += ` | order(bannedAt desc) [${(page - 1) * limit}...${page * limit}] {
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

    // Get total count for pagination
    let countQuery = `count(*[_type == "author" && (isBanned == true || count(banHistory) > 0)`
    if (search) countQuery += ` && (name match "*${search}*" || email match "*${search}*")`
    if (status) {
      const now = new Date().toISOString()
      switch (status) {
        case 'active':
          countQuery += ` && (isBanned == true && (bannedUntil == null || bannedUntil > "${now}"))`
          break
        case 'expired':
          countQuery += ` && (isBanned == true && bannedUntil != null && bannedUntil <= "${now}")`
          break
        case 'permanent':
          countQuery += ` && (isBanned == true && bannedUntil == null)`
          break
      }
    }
    if (startDate || endDate) {
      if (startDate && endDate) {
        countQuery += ` && bannedAt >= "${startDate}" && bannedAt <= "${endDate}"`
      } else if (startDate) {
        countQuery += ` && bannedAt >= "${startDate}"`
      } else if (endDate) {
        countQuery += ` && bannedAt <= "${endDate}"`
      }
    }
    countQuery += `])`

    const [users, totalCount] = await Promise.all([
      client.fetch(query, params),
      client.fetch(countQuery, params)
    ])

    // Process results
    const results = users.map((user: any) => {
      const currentBan = user.banHistory?.find((ban: any) => 
        ban.bannedAt === user.bannedAt || 
        (ban.isPermanent && user.isBanned && !user.bannedUntil)
      )

      return {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        currentStatus: {
          isBanned: user.isBanned,
          bannedUntil: user.bannedUntil,
          isPermanent: user.isBanned && !user.bannedUntil
        },
        strikeCount: user.strikeCount || 0,
        totalBans: user.banHistory?.length || 0,
        latestBan: currentBan ? {
          reason: currentBan.reason,
          bannedAt: currentBan.bannedAt,
          bannedBy: currentBan.bannedBy,
          isPermanent: currentBan.isPermanent,
          strikeCount: currentBan.strikeCount
        } : null,
        banHistory: user.banHistory || []
      }
    })

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        startDate,
        endDate
      }
    })
  } catch (error) {
    console.error('Error fetching ban history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 