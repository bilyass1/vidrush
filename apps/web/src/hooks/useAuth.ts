'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth, clearTokens, type MeResponse } from '@/lib/api'

interface UseAuthReturn {
  user: MeResponse | null
  isLoading: boolean
  error: string | null
  logout: () => void
  refetch: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const data = await auth.me()
      setUser(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      clearTokens()
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(() => {
    auth.logout()
    setUser(null)
  }, [])

  return { user, isLoading, error, logout, refetch: fetchUser }
}
