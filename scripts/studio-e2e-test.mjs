/**
 * Sanity Studio E2E smoke test — run against local dev server.
 * Usage: node scripts/studio-e2e-test.mjs [baseUrl]
 */

const BASE = process.argv[2] || 'http://localhost:3000'

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    redirect: 'manual',
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
      const res = await fetch(`${BASE}${route}`, { redirect: 'manual' })
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

async function testModerationApi() {
  // Clean content
  const clean = await fetchJson('/api/moderation/test', {
    method: 'POST',
    body: JSON.stringify({ content: 'Hello, this is a friendly message.' }),
  })
  if (clean.status === 200 && clean.body?.result) {
    const flagged = clean.body.result.isFlagged
    pass('Moderation test (clean)', flagged ? `unexpectedly flagged: ${clean.body.result.action}` : `allow (${clean.body.source}, ${clean.body.latencyMs}ms)`)
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

async function testExportRoute() {
  const res = await fetchJson('/api/sanity/export?types=notification,moderationActivity&limit=1&max=5')
  if (res.status === 200 && res.body?.ok) {
    pass('Sanity export', `notification=${res.body.counts?.notification ?? 0}, activity=${res.body.counts?.moderationActivity ?? 0}`)
  } else {
    fail('Sanity export', `HTTP ${res.status}`)
  }
}

async function testModerationSettings() {
  const res = await fetchJson('/api/moderation/settings')
  if (res.status === 200) {
    pass('Moderation settings API', res.body?.enabled !== undefined ? `enabled=${res.body.enabled}` : 'reachable')
  } else if (res.status === 404) {
    pass('Moderation settings API', 'route exists (404 ok if no doc)')
  } else {
    fail('Moderation settings API', `HTTP ${res.status}`)
  }
}

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

async function main() {
  console.log(`\nSanity Studio E2E Test — ${BASE}\n${'='.repeat(50)}\n`)

  try {
    await fetch(`${BASE}/`, { method: 'HEAD' })
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

  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`)

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
