/**
 * Stub for `tsc -p tsconfig.tests.json` path resolution only.
 * Vitest replaces `@/auth` via `vi.mock('@/auth', ...)`.
 */
export async function auth(): Promise<{
  user: { email?: string | null; id?: string; name?: string | null }
} | null> {
  return null
}
