'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import BadgeLabels from '@/components/badges/BadgeLabels'

interface SavedUser {
  _id: string
  name: string
  username: string
  image?: string
  bio?: string
  followers?: string[]
  following?: string[]
  badges?: { _id: string; badge: any; earnedAt: string }[]
}

export default function SavedUsersList() {
  const [users, setUsers] = useState<SavedUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await fetch('/api/saved-users', { cache: 'no-store' })
        const data = await res.json()
        if (!ignore) {
          if (data.success) {
            setUsers(data.users || [])
          } else {
            setError(data.message || 'Failed to load saved users')
          }
        }
      } catch (e) {
        if (!ignore) setError('Failed to load saved users')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading saved users...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  if (!users.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved users yet</h3>
        <p className="text-gray-500">Start exploring user profiles and save the ones you want to follow!</p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {users.map((u) => {
        const activeBadges = (u.badges || []).map((ub) => ub.badge).filter(Boolean)
        const followersCount = u.followers?.length || 0
        const followingCount = u.following?.length || 0
        return (
          <li key={u._id}>
            <div className="profile_card scale-95 mt-2">
              <div className="profile_title">
                <h3 className="text-24-black uppercase text-center line-clamp-1">{u.name}</h3>
              </div>
              <a href={`/user/${u._id}`} className="block w-full">
                <div className="mx-auto mt-1 mb-3" style={{ width: 200, height: 200 }}>
                  <div className="relative w-[200px] h-[200px] mx-auto">
                    <div className="profile_image w-[200px] h-[200px] overflow-hidden rounded-full">
                      {u.image ? (
                        <Image src={u.image} alt={u.name} width={200} height={200} className="object-cover w-[200px] h-[200px]" />
                      ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 text-6xl">👤</div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
              <p className="text-30-extrabold mt-1 text-center">@{u.username}</p>
              {u.bio ? (
                <p className="mt-1 text-center text-14-normal px-4">{u.bio}</p>
              ) : null}

              {activeBadges.length > 0 && (
                <div className="mt-2 w-full px-2">
                  <BadgeLabels badges={activeBadges} maxDisplay={6} showRarity={true} showTier={true} compact={true} />
                </div>
              )}

              <p className="mt-3 text-center text-sm font-medium">
                {followersCount} followers · {followingCount} following
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}


