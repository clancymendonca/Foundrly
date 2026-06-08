import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/get-session', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/sanity/lib/client', () => ({
  client: {
    fetch: vi.fn(),
  },
}))

vi.mock('@/sanity/lib/write-client', () => ({
  writeClient: {
    create: vi.fn(),
  },
}))

vi.mock('@/sanity/lib/moderation-mutations', () => ({
  logModerationActivity: vi.fn(),
}))

import { getSession } from '@/lib/get-session';
import { POST } from './route'

describe('POST /api/reports/submit', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset()
  })

  it('returns 401 when there is no session email', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/reports/submit', {
      method: 'POST',
      body: JSON.stringify({
        reportedType: 'startup',
        reportedRef: 'id1',
        reason: 'spam',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { email: 'reporter@example.com' },
    } as never)

    const request = new NextRequest('http://localhost/api/reports/submit', {
      method: 'POST',
      body: JSON.stringify({ reportedType: 'startup' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Missing required fields')
  })

  it('returns 400 when reportedType is invalid', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { email: 'reporter@example.com' },
    } as never)

    const request = new NextRequest('http://localhost/api/reports/submit', {
      method: 'POST',
      body: JSON.stringify({
        reportedType: 'invalid',
        reportedRef: 'id1',
        reason: 'spam',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Invalid reportedType')
  })
})
