import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ 
        error: 'User IDs array is required' 
      }, { status: 400 })
    }

    if (userIds.length > 100) {
      return NextResponse.json({ 
        error: 'Maximum 100 users can be checked at once' 
      }, { status: 400 })
    }

    // Fetch users with strike counts
    const users = await client.fetch(
      `*[_type == "author" && _id in $userIds]{
        _id,
        name,
        email,
        strikeCount,
        isBanned,
        bannedUntil
      }`,
      { userIds }
    )

    // Process results
    const results = users.map((user: any) => ({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      strikeCount: user.strikeCount || 0,
      isBanned: user.isBanned,
      bannedUntil: user.bannedUntil,
      nextStrikeAction: getNextStrikeAction(user.strikeCount || 0)
    }))

    // Create a map for quick lookup
    const userMap = new Map()
    results.forEach((user: any) => {
      userMap.set(user.userId, user)
    })

    // Include users that weren't found
    const notFound = userIds.filter((id: string) => !userMap.has(id))
    const notFoundResults = notFound.map((id: string) => ({
      userId: id,
      error: 'User not found',
      strikeCount: 0,
      nextStrikeAction: 'No action'
    }))

    return NextResponse.json({
      results: [...results, ...notFoundResults],
      summary: {
        total: userIds.length,
        found: results.length,
        notFound: notFound.length,
        averageStrikes: results.length > 0 
          ? results.reduce((sum: number, u: any) => sum + u.strikeCount, 0) / results.length 
          : 0,
        usersWithStrikes: results.filter((u: any) => u.strikeCount > 0).length
      }
    })
  } catch (error) {
    console.error('Error fetching strike counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getNextStrikeAction(strikeCount: number): string {
  switch (strikeCount) {
    case 0:
      return 'First strike: 24-hour ban'
    case 1:
      return 'Second strike: 7-day ban'
    case 2:
      return 'Third strike: Permanent ban'
    default:
      return 'Already permanently banned'
  }
} 