import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

export interface BanStatus {
  isBanned: boolean
  banReason?: string
  banEndDate?: string | null
  isPermanent: boolean
  message: string
}

export function useBanCheck() {
  const { data: session } = useSession()
  const [banStatus, setBanStatus] = useState<BanStatus>({
    isBanned: false,
    isPermanent: false,
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // Initialize mounted ref
  if (!mountedRef.current) {
    mountedRef.current = true
  }

  const checkBanStatus = useCallback(async () => {
    if (!session?.user?.id) {
      if (mountedRef.current) {
        setBanStatus({
          isBanned: false,
          isPermanent: false,
          message: ''
        })
        setError(null)
      }
      return
    }

    if (mountedRef.current) {
      setIsLoading(true)
      setError(null)
    }
    
    try {
      const response = await fetch(`/api/user/${session.user.id}/ban-status`)
      if (mountedRef.current) {
        if (response.ok) {
          const data = await response.json()
          setBanStatus(data)
        } else {
          setBanStatus({
            isBanned: false,
            isPermanent: false,
            message: ''
          })
          setError('Failed to check ban status')
        }
      }
    } catch (error) {
      console.error('Error checking ban status:', error)
      if (mountedRef.current) {
        setBanStatus({
          isBanned: false,
          isPermanent: false,
          message: ''
        })
        setError('Error checking ban status')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [session?.user?.id])

  // Manual trigger function that can be called after mount
  const triggerCheck = useCallback(() => {
    if (session?.user?.id) {
      checkBanStatus()
    }
  }, [session?.user?.id, checkBanStatus])

  return {
    banStatus,
    isLoading,
    error,
    isBanned: banStatus.isBanned,
    banMessage: banStatus.message,
    refetch: checkBanStatus,
    triggerCheck
  }
} 