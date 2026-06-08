import 'server-only'

import { auth } from '@/auth'

/**
 * Parse the comma-separated `ADMIN_USER_IDS` environment variable into an array of trimmed admin user IDs.
 *
 * @returns The list of admin user ID strings from `process.env.ADMIN_USER_IDS`; an empty array when unset or when no valid entries are present.
 */
export function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Check whether a user ID is considered an admin according to configured admin IDs.
 *
 * If no admin IDs are configured, any non-empty `userId` is treated as an admin.
 *
 * @param userId - The user ID to check; may be `undefined` or `null`
 * @returns `true` if the user ID is considered an admin, `false` otherwise
 */
export function isAdminUserId(userId: string | undefined | null): boolean {
  if (!userId) return false
  const admins = getAdminUserIds()
  if (admins.length === 0) return true
  return admins.includes(userId)
}

/**
 * Retrieves the current authenticated session if the user is an admin.
 *
 * @returns The session object for the authenticated admin user, or `null` if no session exists or the user is not an admin.
 */
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

/**
 * Ensure the current user is an authenticated admin and return their session.
 *
 * @returns The authenticated admin session.
 * @throws Error if no admin session is available (message: 'Unauthorized').
 */
export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Determines whether moderation test functionality is permitted for the given request.
 *
 * Permission is granted when any of the following apply: the runtime is in development mode, the request provides an `x-moderation-test-secret` header that matches `process.env.MODERATION_TEST_SECRET`, or the request `host` header indicates `localhost` or `127.0.0.1`.
 *
 * @param request - The incoming HTTP request whose headers are inspected
 * @returns `true` if moderation tests are allowed for the request, `false` otherwise
 */
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
