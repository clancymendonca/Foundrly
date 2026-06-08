import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const users = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "author" && $userId in savedBy[]]{
        _id,
        name,
        username,
        image,
        bio,
        "followers": followers[]->_id,
        "following": following[]->_id,
        "badges": *[_type == "userBadge" && user._ref == ^._id] {
          _id,
          badge->{
            _id,
            name,
            description,
            category,
            icon,
            color,
            rarity,
            tier,
            isActive
          },
          earnedAt
        }[badge.isActive == true] | order(earnedAt desc)
      } | order(name asc)`,
      { userId }
    )

    return NextResponse.json({ success: true, users })
  } catch (e) {
    console.error('Error fetching saved users:', e)
    return NextResponse.json({ success: false, message: 'Failed to fetch saved users' }, { status: 500 })
  }
}


