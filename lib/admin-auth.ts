import 'server-only'

import { auth } from '@/auth'

export function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

export function isAdminUserId(userId: string | undefined | null): boolean {
  if (!userId) return false
  const admins = getAdminUserIds()
  if (admins.length === 0) return true
  return admins.includes(userId)
}

export async function getAdminSession() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  if (!isAdminUserId(session.user.id)) {
    return null
  }
  return session
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export function isModerationTestAllowed(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const secret = process.env.MODERATION_TEST_SECRET
  if (secret && request.headers.get('x-moderation-test-secret') === secret) {
    return true
  }

  const host = request.headers.get('host') ?? ''
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return true
  }

  return false
}
