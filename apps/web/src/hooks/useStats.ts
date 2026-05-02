'use client'

import { useState, useEffect, useCallback } from 'react'
import { video, type DashboardStats } from '@/lib/api'
import type { VideoGeneration } from '@vidrush/shared'

interface UseStatsReturn {
  stats: DashboardStats | null
  recentVideos: VideoGeneration[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentVideos, setRecentVideos] = useState<VideoGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statsData, videosData] = await Promise.all([
        video.stats(),
        video.recent(),
      ])
      setStats(statsData)
      setRecentVideos(videosData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, recentVideos, isLoading, error, refetch: fetchStats }
}
