import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { moderationCheckHandler } from '@/lib/moderation-api'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  return moderationCheckHandler(body.content)
}
