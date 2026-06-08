import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch user with ban history
    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{
        _id,
        name,
        email,
        bannedUntil,
        isBanned,
        banHistory[]{
          reason,
          bannedUntil,
          bannedAt,
          bannedBy,
          isPermanent,
          strikeCount
        }
      }`,
      { userId }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      currentBanStatus: {
        isBanned: user.isBanned,
        bannedUntil: user.bannedUntil
      },
      banHistory: user.banHistory || []
    })
  } catch (error) {
    console.error('Error fetching ban history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 