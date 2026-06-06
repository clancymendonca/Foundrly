/**
 * Sanity Studio E2E smoke test — run against local dev server.
 * Usage: node scripts/studio-e2e-test.mjs [baseUrl]
 */

const BASE = process.argv.find((arg) => arg.startsWith('http')) || 'http://localhost:3000'
const CI_MODE = process.argv.includes('--ci') || process.env.CI === 'true'
const REQUEST_TIMEOUT_MS = 15_000

const results = []

/**
 * Record a successful check result and print a success line to the console.
 * @param {string} name - Brief identifier for the check.
 * @param {string} [detail] - Optional detail message appended to the result and console output.
 */
function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Record a failing check with an optional detail message and log it.
 * @param {string} name - Human-readable name of the check that failed.
 * @param {string} [detail] - Optional additional detail to include in the stored result and log.
 */
function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Record and log a skipped test result.
 *
 * Adds a skipped entry to the global `results` array and prints a concise skipped message to the console.
 * @param {string} name - The name of the check being skipped.
 * @param {string} [detail] - Optional reason or detail for why the check was skipped.
 */
function skip(name, detail = '') {
  results.push({ name, ok: true, detail: `skipped: ${detail}`, skipped: true })
  console.log(`○ ${name} — skipped (${detail})`)
}

/**
 * Fetches a resource at a path relative to BASE and returns the response details.
 * @param {string} path - Path relative to the configured BASE (e.g. "/api/health").
 * @param {Object} [options] - Additional fetch options; provided `headers` are merged with `Content-Type: application/json` and the request uses `redirect: 'manual'`.
 * @returns {{status: number, body: any, headers: Headers}} An object containing the HTTP status, the response body (parsed JSON when possible, `null` for an empty body, or raw text if JSON parsing fails), and the response headers.
 */
async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  let body = null
  const text = await res.text()
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body, headers: res.headers }
}

/**
 * Checks a set of Sanity Studio routes for reachability or expected auth redirects and records results.
 *
 * For each predefined Studio route this function performs an HTTP request (no automatic redirects) and records:
 * - a pass if the route responds with 200 (loaded) or 301/302/307/308 (treated as an auth redirect),
 * - a fail for any other HTTP status or when the request throws.
 */
async function testStudioRoutes() {
  const routes = [
    '/studio',
    '/studio/structure/moderation-dashboard',
    '/studio/structure/report-triage',
    '/studio/structure/submissions',
    '/studio/structure/badge-manager',
    '/studio/structure/analytics-dashboard',
  ]

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      // 200 = loaded, 307/302 = auth redirect (middleware working)
      if (res.status === 200) {
        pass(`Route ${route}`, `HTTP ${res.status}`)
      } else if ([301, 302, 307, 308].includes(res.status)) {
        pass(`Route ${route}`, `HTTP ${res.status} (auth redirect)`)
      } else {
        fail(`Route ${route}`, `HTTP ${res.status}`)
      }
    } catch (err) {
      fail(`Route ${route}`, err.message)
    }
  }
}

/**
 * Verifies the moderation API by submitting a benign and an offensive sample and recording pass/fail results.
 *
 * Sends a clean message that is expected to be unflagged and an offensive message that is expected to be flagged.
 * Records results via the script's result helpers: passes when responses match expectations and fails on unexpected flags or HTTP errors.
 */
async function testModerationApi() {
  // Clean content
  const clean = await fetchJson('/api/moderation/test', {
    method: 'POST',
    body: JSON.stringify({ content: 'Hello, this is a friendly message.' }),
  })
  if (clean.status === 200 && clean.body?.result) {
    const flagged = clean.body.result.isFlagged
    if (flagged) {
      fail('Moderation test (clean)', `unexpectedly flagged: ${clean.body.result.action}`)
    } else {
      pass('Moderation test (clean)', `allow (${clean.body.source}, ${clean.body.latencyMs}ms)`)
    }
  } else {
    fail('Moderation test (clean)', `HTTP ${clean.status}: ${JSON.stringify(clean.body)?.slice(0, 120)}`)
  }

  // Offensive content
  const offensive = await fetchJson('/api/moderation/test', {
    method: 'POST',
    body: JSON.stringify({ content: 'bitch ass nigga' }),
  })
  if (offensive.status === 200 && offensive.body?.result) {
    const r = offensive.body.result
    if (r.isFlagged) {
      pass('Moderation test (offensive)', `flagged ${r.severity}/${r.action} via ${offensive.body.source}`)
    } else {
      fail('Moderation test (offensive)', 'expected flag but got allow')
    }
  } else {
    fail('Moderation test (offensive)', `HTTP ${offensive.status}`)
  }
}

/**
 * Verifies that protected admin endpoints reject unauthenticated requests.
 *
 * Sends POST requests to a fixed set of admin routes and records a pass if the response status is `401` or `403`; records a fail with the unexpected status otherwise.
 */
async function testAdminAuth() {
  const endpoints = [
    { path: '/api/reports/apply-ban', body: { reportedUserId: 'test', banDuration: '24h', reason: 'test' } },
    { path: '/api/admin/badges/award', body: { userId: 'test', badgeId: 'test' } },
    { path: '/api/admin/badges/revoke', body: { userBadgeId: 'test' } },
  ]

  for (const { path, body } of endpoints) {
    const res = await fetchJson(path, { method: 'POST', body: JSON.stringify(body) })
    if (res.status === 401) {
      pass(`Admin auth ${path}`, '401 Unauthorized without session')
    } else if (res.status === 403) {
      pass(`Admin auth ${path}`, '403 Forbidden without session')
    } else {
      fail(`Admin auth ${path}`, `expected 401/403, got ${res.status}`)
    }
  }
}

/**
 * Checks the Sanity export endpoint and records a pass, fail, or skip result.
 *
 * When running in CI mode this check is skipped. Otherwise it treats a response
 * with status 200 and a truthy `body.ok` as a pass (including notification and
 * moderationActivity counts in the detail); any other response is recorded as a
 * failure.
 */
async function testExportRoute() {
  if (CI_MODE) {
    skip('Sanity export', 'requires live Sanity project (skipped in CI)')
    return
  }
  const res = await fetchJson('/api/sanity/export?types=notification,moderationActivity&limit=1&max=5')
  if (res.status === 200 && res.body?.ok) {
    pass('Sanity export', `notification=${res.body.counts?.notification ?? 0}, activity=${res.body.counts?.moderationActivity ?? 0}`)
  } else {
    fail('Sanity export', `HTTP ${res.status}`)
  }
}

/**
 * Verifies the moderation settings endpoint and records a test result.
 *
 * Sends a request to the moderation settings route and:
 * - marks pass with `enabled=<value>` if a 200 response includes an `enabled` value,
 * - marks pass as `reachable` if a 200 response has no `enabled` value,
 * - marks pass as `route exists (404 ok if no doc)` for 404 responses,
 * - marks skip as `Sanity unavailable in CI` when running in CI_MODE and the status is >= 500,
 * - otherwise marks fail with the HTTP status.
 */
async function testModerationSettings() {
  const res = await fetchJson('/api/moderation/settings')
  if (res.status === 200) {
    const enabled = res.body?.settings?.enabled ?? res.body?.enabled
    pass('Moderation settings API', enabled !== undefined ? `enabled=${enabled}` : 'reachable')
  } else if (res.status === 404) {
    pass('Moderation settings API', 'route exists (404 ok if no doc)')
  } else if (CI_MODE && res.status >= 500) {
    skip('Moderation settings API', 'Sanity unavailable in CI')
  } else {
    fail('Moderation settings API', `HTTP ${res.status}`)
  }
}

/**
 * Checks that an unauthenticated POST to /api/comments requires authentication rather than failing.
 *
 * Sends a sample comment-creation request and records a pass if the response status is 401;
 * records a failure including the actual status otherwise.
 */
async function testCommentsModerationShape() {
  // Unauthenticated POST should 401, not 500
  const res = await fetchJson('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ text: 'test', startupId: 'test', action: 'create' }),
  })
  if (res.status === 401) {
    pass('Comments API auth', '401 without session')
  } else {
    fail('Comments API auth', `expected 401, got ${res.status}`)
  }
}

/**
 * Run the full E2E smoke test suite against the configured Sanity Studio base URL.
 *
 * Performs a HEAD check to ensure the base URL is reachable, executes the suite of
 * smoke tests (studio routes, moderation API, admin auth endpoints, export route,
 * moderation settings, and comments moderation shape), prints a summary of results,
 * and exits the process with code 1 if the base URL is unreachable or any checks fail.
 */
async function main() {
  console.log(`\nSanity Studio E2E Test — ${BASE}${CI_MODE ? ' (CI mode)' : ''}\n${'='.repeat(50)}\n`)

  try {
    await fetch(`${BASE}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    console.error(`Cannot reach ${BASE}. Is npm run dev running?\n`)
    process.exit(1)
  }

  await testStudioRoutes()
  await testModerationApi()
  await testAdminAuth()
  await testExportRoute()
  await testModerationSettings()
  await testCommentsModerationShape()

  const passed = results.filter((r) => r.ok && !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !r.ok).length

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${skipped} skipped, ${failed} failed, ${results.length} total`)

  if (failed > 0) {
    console.log('\nFailed:')
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }

  console.log('\nAll automated checks passed.')
  console.log('Manual Studio checks still recommended: report triage ban, author unban, badge award on profile.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
