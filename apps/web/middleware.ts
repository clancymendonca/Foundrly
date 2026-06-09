import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

const PROTECTED_PREFIXES = ['/admin', '/studio']

/**
 * Loads the comma-separated `ADMIN_USER_IDS` environment variable and returns the parsed list of admin user IDs.
 *
 * @returns An array of trimmed, non-empty admin user ID strings; an empty array if `ADMIN_USER_IDS` is unset or contains no entries.
 */
function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Enforces authentication and optional admin allowlist for requests to protected routes.
 *
 * For paths under `/admin` or `/studio`, redirects unauthenticated requests to the NextAuth sign-in page with the original pathname set as `callbackUrl`, redirects authenticated users who are not in the `ADMIN_USER_IDS` allowlist to `/`, and allows all other requests to proceed.
 *
 * @param request - The incoming Next.js request
 * @returns A `NextResponse` that either continues the request or redirects the client to sign-in or `/` depending on authentication and authorization state
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const session = await auth()
  const adminIds = getAdminUserIds()

  if (!session?.user?.id) {
    const signInUrl = new URL('/login', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (adminIds.length > 0 && !adminIds.includes(session.user.id)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/studio/:path*'],
}
