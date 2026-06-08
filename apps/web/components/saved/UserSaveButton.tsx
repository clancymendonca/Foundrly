'use client'

import React from 'react'
import { Bookmark } from 'lucide-react'

interface UserSaveButtonProps {
  profileId: string
  currentUserId?: string
  className?: string
}

export default function UserSaveButton({ profileId, currentUserId, className }: UserSaveButtonProps) {
  const [saved, setSaved] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!currentUserId || !profileId || profileId === currentUserId) return
      try {
        const res = await fetch(`/api/saved-user?profileId=${encodeURIComponent(profileId)}`)
        const data = await res.json()
        if (!ignore && data.success) {
          setSaved(!!data.saved)
        }
      } catch (e) {
        // noop
      }
    }
    load()
    return () => { ignore = true }
  }, [profileId, currentUserId])

  const handleToggle = async () => {
    if (!currentUserId || loading) return
    if (profileId === currentUserId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/saved-user?profileId=${encodeURIComponent(profileId)}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setSaved(!!data.saved)
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  if (!currentUserId || profileId === currentUserId) {
    return null
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Unsave user' : 'Save user'}
      title={saved ? 'Unsave' : 'Save'}
      onClick={handleToggle}
      disabled={loading}
      className={`group flex items-center justify-center p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${saved ? 'bg-blue-500 text-white shadow-blue-200 hover:bg-blue-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'} ${loading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'} ${className || ''}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <Bookmark className={`size-5 transition-transform duration-200 ${saved ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
      )}
    </button>
  )
}


