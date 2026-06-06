import { NextResponse } from 'next/server'
import { isModerationTestAllowed } from '@/lib/admin-auth'
import { moderationCheckHandler } from '@/lib/moderation-api'

/**
 * Handles POST requests to run a moderation check on provided content.
 *
 * @param request - Incoming HTTP request whose JSON body is expected to include a `content` field to be checked. If the request is not allowed by `isModerationTestAllowed`, a 401 response is returned.
 * @returns The result produced by `moderationCheckHandler` for the provided content, or a `NextResponse` with status 401 when the request is unauthorized.
 */
export async function POST(request: Request) {
  if (!isModerationTestAllowed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  return moderationCheckHandler(body.content)
}
