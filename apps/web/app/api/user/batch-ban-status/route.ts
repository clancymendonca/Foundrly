import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { isCurrentlyBanned } from '@/sanity/lib/moderation'

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

    // Fetch all users with their ban status
    const users = await client.fetch(
      `*[_type == "author" && _id in $userIds]{
        _id,
        name,
        email,
        bannedUntil,
        isBanned,
        strikeCount
      }`,
      { userIds }
    )

    // Process results
    const results = users.map((user: any) => {
      const isBanned = isCurrentlyBanned(user.bannedUntil, user.isBanned)
      
      return {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        isBanned,
        banEndDate: user.bannedUntil,
        isPermanent: user.isBanned && !user.bannedUntil,
        strikeCount: user.strikeCount || 0,
        canPerformActions: !isBanned
      }
    })

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
      isBanned: false,
      canPerformActions: true
    }))

    return NextResponse.json({
      results: [...results, ...notFoundResults],
      summary: {
        total: userIds.length,
        found: results.length,
        notFound: notFound.length,
        banned: results.filter((u: any) => u.isBanned).length,
        active: results.filter((u: any) => !u.isBanned).length
      }
    })
  } catch (error) {
    console.error('Error checking batch ban status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 