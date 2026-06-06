import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'

/**
 * Revokes a user badge identified by `userBadgeId` in the request body for an authenticated admin.
 *
 * @returns A NextResponse containing `{ success: true }` on success, or `{ error: string }` with an appropriate HTTP status (`401`, `400`, `404`, or `500`) on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userBadgeId } = await request.json()
    if (!userBadgeId) {
      return NextResponse.json({ error: 'userBadgeId is required' }, { status: 400 })
    }

    const userBadge = await client.fetch(
      `*[_type == "userBadge" && _id == $userBadgeId][0]{ _id }`,
      { userBadgeId }
    )

    if (!userBadge) {
      return NextResponse.json({ error: 'User badge not found' }, { status: 404 })
    }

    await writeClient.delete(userBadgeId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking badge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
