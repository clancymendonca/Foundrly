import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { getSession } from '@/lib/get-session';

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin access is handled through Sanity Studio
    // This endpoint is for programmatic access only

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Build the query for all matching users
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

    query += ` | order(bannedAt desc) {
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

    const users = await client.fetch(query, params)

    // Generate CSV content
    const csvHeaders = [
      'User ID',
      'User Name',
      'User Email',
      'Current Status',
      'Current Ban Until',
      'Is Permanent Ban',
      'Strike Count',
      'Total Bans',
      'Latest Ban Reason',
      'Latest Ban Date',
      'Latest Ban By',
      'Latest Ban Strike Count'
    ]

    const csvRows = users.map((user: any) => {
      const currentBan = user.banHistory?.find((ban: any) => 
        ban.bannedAt === user.bannedAt || 
        (ban.isPermanent && user.isBanned && !user.bannedUntil)
      )

      return [
        user._id,
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        user.isBanned ? 'Banned' : 'Active',
        user.bannedUntil || '',
        user.isBanned && !user.bannedUntil ? 'Yes' : 'No',
        user.strikeCount || 0,
        user.banHistory?.length || 0,
        `"${currentBan?.reason || ''}"`,
        currentBan?.bannedAt || '',
        `"${currentBan?.bannedBy || ''}"`,
        currentBan?.strikeCount || 0
      ].join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')

    // Create response with CSV headers
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set('Content-Disposition', `attachment; filename="ban-history-${new Date().toISOString().split('T')[0]}.csv"`)

    return response
  } catch (error) {
    console.error('Error exporting ban history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 