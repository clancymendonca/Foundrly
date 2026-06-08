import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/write-client'
import { MetricCalculator, TimeframeCalculator, StreakTracker } from '@/lib/badges/enhanced-badge-system'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = body?.userId as string | undefined
    const scope = (body?.scope as 'user' | 'all') || (userId ? 'user' : 'all')

    if (scope === 'user') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
      }

      // Load all active badges
      const badges = await client.fetch(`
        *[_type == "badge" && isActive == true] {
          _id, name, description, category, icon, color, rarity, criteria
        }
      `)

      // Preload user's existing userBadge refs
      const existing = await client.fetch(`
        *[_type == "userBadge" && user._ref == $userId]{ badge->{_id} }
      `, { userId }) as Array<{ badge: { _id: string } }>
      const already = new Set(existing.map(e => e.badge?._id).filter(Boolean))

      const streak = StreakTracker.getInstance()
      let awarded = 0
      let checked = 0
      const details: any[] = []

      for (const badge of badges) {
        checked++
        const { criteria } = badge

        let current = 0
        let target = criteria?.target ?? 1
        let isEarned = false

        try {
          switch (criteria?.type) {
            case 'streak': {
              const res = await streak.checkStreakBadge(userId, criteria.metric, criteria.timeframe)
              current = res.currentStreak
              isEarned = current >= target
              break
            }
            case 'combination': {
              const reqs = criteria.requirements || []
              let allOk = true
              let agg = 0
              for (const r of reqs) {
                const val = await MetricCalculator.calculateMetric(userId, r.metric, r.timeframe)
                if (val < r.target) allOk = false
                agg += Math.min(val / r.target, 1)
              }
              current = Math.round((agg / (reqs.length || 1)) * 100)
              target = 100
              isEarned = allOk
              break
            }
            case 'quality':
            case 'time':
            default: {
              current = await MetricCalculator.calculateMetric(userId, criteria.metric, criteria.timeframe)
              isEarned = current >= target
            }
          }
        } catch (e) {
          details.push({ badgeId: badge._id, name: badge.name, error: true })
          continue
        }

        // If user already has this badge, always refresh progress
        const existingId = await client.fetch(
          `*[_type == "userBadge" && user._ref == $userId && badge._ref == $badgeId][0]._id`,
          { userId, badgeId: badge._id }
        )

        if (existingId) {
          await writeClient
            .patch(existingId)
            .set({
              progress: {
                current,
                target,
                percentage: Math.min((current / (target || 1)) * 100, 100),
              },
            })
            .commit({ autoGenerateArrayKeys: true })

          details.push({ badgeId: badge._id, name: badge.name, updatedProgress: true })
          continue
        }

        // Create new userBadge only when criteria met
        if (isEarned) {
          await writeClient.create({
            _type: 'userBadge',
            user: { _ref: userId, _type: 'reference' },
            badge: { _ref: badge._id, _type: 'reference' },
            earnedAt: new Date().toISOString(),
            progress: {
              current,
              target,
              percentage: Math.min((current / (target || 1)) * 100, 100)
            },
            metadata: { context: 'recalculate' }
          })
          awarded++
          already.add(badge._id)
          details.push({ badgeId: badge._id, name: badge.name, awarded: true })
          continue
        }

        // Not earned and not existing → just record check with progress
        details.push({ badgeId: badge._id, name: badge.name, awarded: false, progress: { current, target } })
      }

      return NextResponse.json({ ok: true, scope, result: { awarded, checked, details } })
    }

    // Recalculate for all users
    const limit = typeof body?.limit === 'number' ? body.limit : 50
    const users: Array<{ _id: string }> = await client.fetch(`*[_type=="author"]{_id}[0...$limit]`, { limit })
    let totalAwarded = 0
    for (const u of users) {
      const res = await fetch(new URL('/api/badges/recalculate', req.nextUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u._id, scope: 'user' })
      })
      const data = await res.json().catch(() => ({}))
      totalAwarded += data?.result?.awarded || 0
    }
    return NextResponse.json({ ok: true, scope: 'all', result: { usersProcessed: users.length, totalAwarded } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to recalculate badges' }, { status: 500 })
  }
}


