import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session';
import { moderationCheckHandler } from '@/lib/moderation-api'

/**
 * Handle POST requests to run a moderation check on submitted content.
 *
 * If the caller is not authenticated (no session user id), responds with a JSON
 * error and HTTP status 401. Otherwise, parses the request JSON and passes
 * the `content` field to the moderation check handler, returning its result.
 *
 * @param request - Incoming request whose JSON body must include a `content` field
 * @returns The response produced by the moderation check handler for the provided content
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  return moderationCheckHandler(body.content)
}
