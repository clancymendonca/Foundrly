'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function BadgeRecalcButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleRecalc() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/badges/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'user', userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setStatus(`Awarded ${data.result?.awarded || 0} new badge(s)`) 
    } catch (e: any) {
      setStatus(e.message || 'Failed to recalculate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 justify-center mt-2">
      <Button size="sm" variant="outline" onClick={handleRecalc} disabled={loading}>
        {loading ? 'Updating…' : 'Update badges from data'}
      </Button>
      {status && <span className="text-xs text-gray-600">{status}</span>}
    </div>
  )
}


