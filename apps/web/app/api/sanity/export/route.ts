import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

// Default document types to export. Adjust as needed.
const DEFAULT_TYPES = [
  'author',
  'startup',
  'comment',
  'notification',
  'report',
  'playlist',
  'pushSubscription',
  'moderationSettings',
  'moderationActivity',
  'badge',
  'userBadge',
]

async function fetchAllOfType(type: string, limit: number, max: number) {
  const all: any[] = []
  let offset = 0
  while (true) {
    const slice = await client.fetch(
      `*[_type == $type][$offset...$end]`,
      { type, offset, end: offset + limit }
    )
    if (!slice?.length) break
    all.push(...slice)
    offset += slice.length
    if (offset >= max) break
  }
  return all
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typesParam = searchParams.get('types')
    const limit = Number(searchParams.get('limit') || 500)
    const max = Number(searchParams.get('max') || 5000)
    const types = (typesParam ? typesParam.split(',') : DEFAULT_TYPES).map(t => t.trim()).filter(Boolean)

    const result: Record<string, any[]> = {}
    const counts: Record<string, number> = {}

    for (const t of types) {
      const docs = await fetchAllOfType(t, limit, max)
      result[t] = docs
      counts[t] = docs.length
    }

    return NextResponse.json({ ok: true, counts, data: result })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to export Sanity data' }, { status: 500 })
  }
}


