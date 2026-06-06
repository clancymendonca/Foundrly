import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

const PROTECTED_PREFIXES = ['/admin', '/studio']

function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

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
    const signInUrl = new URL('/api/auth/signin', request.url)
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
