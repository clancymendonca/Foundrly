import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session';
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  if (!profileId) {
    return NextResponse.json({ success: false, message: 'Missing profileId' }, { status: 400 })
  }

  try {
    const doc = await client.fetch(
      `*[_type == "author" && _id == $id][0]{ savedBy }`,
      { id: profileId }
    )
    const savedBy: string[] = doc?.savedBy ?? []
    return NextResponse.json({ success: true, savedBy, saved: savedBy.includes(session.user.id) })
  } catch (e) {
    console.error('Error reading saved user state:', e)
    return NextResponse.json({ success: false, message: 'Failed to read state' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  const currentUserId = session.user.id
  if (!profileId) {
    return NextResponse.json({ success: false, message: 'Missing profileId' }, { status: 400 })
  }

  // Prevent saving self
  if (profileId === currentUserId) {
    return NextResponse.json({ success: false, message: 'You cannot save your own profile' }, { status: 400 })
  }

  try {
    const doc = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "author" && _id == $id][0]{ savedBy }`,
      { id: profileId }
    )
    if (!doc) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    let savedBy: string[] = doc.savedBy ?? []
    const isSaved = savedBy.includes(currentUserId)
    if (isSaved) {
      savedBy = savedBy.filter((uid) => uid !== currentUserId)
    } else {
      savedBy.push(currentUserId)
    }

    await writeClient.patch(profileId).set({ savedBy }).commit()
    return NextResponse.json({ success: true, saved: !isSaved, savedBy })
  } catch (e) {
    console.error('Error toggling saved user:', e)
    return NextResponse.json({ success: false, message: 'Failed to toggle' }, { status: 500 })
  }
}


