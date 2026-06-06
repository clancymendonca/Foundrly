import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'

/**
 * Awards a badge to a user by creating a `userBadge` document in Sanity.
 *
 * @param request - A NextRequest whose JSON body must include `userId` and `badgeId` (both strings).
 * @returns A JSON response: on success `{ success: true, userBadge }` containing the created document; on error `{ error: string }` with an appropriate HTTP status (`401`, `400`, `404`, `409`, or `500`).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, badgeId } = await request.json()
    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId and badgeId are required' }, { status: 400 })
    }

    const [author, badge, existing] = await Promise.all([
      client.fetch(`*[_type == "author" && _id == $userId][0]{ _id }`, { userId }),
      client.fetch(`*[_type == "badge" && _id == $badgeId][0]{ _id, name }`, { badgeId }),
      client.fetch(
        `*[_type == "userBadge" && user._ref == $userId && badge._ref == $badgeId][0]{ _id }`,
        { userId, badgeId }
      ),
    ])

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }
    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }
    if (existing) {
      return NextResponse.json({ error: 'User already has this badge' }, { status: 409 })
    }

    const userBadge = await writeClient.create({
      _type: 'userBadge',
      user: { _type: 'reference', _ref: userId },
      badge: { _type: 'reference', _ref: badgeId },
      earnedAt: new Date().toISOString(),
      metadata: {
        context: 'manual_award',
      },
    })

    return NextResponse.json({ success: true, userBadge })
  } catch (error) {
    console.error('Error awarding badge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
