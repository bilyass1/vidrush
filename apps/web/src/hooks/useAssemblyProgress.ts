'use client'

import { useState, useEffect } from 'react'
import { onAssemblyProgress } from '@/lib/tauri'

export function useAssemblyProgress() {
  const [progress, setProgress] = useState(0)
  const [isAssembling, setIsAssembling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as unknown as Record<string, unknown>).__TAURI__) return

    let cancelled = false
    const unlistenPromise = onAssemblyProgress((percent) => {
      if (cancelled) return
      setProgress(percent)
      if (percent >= 100) setIsAssembling(false)
    })

    return () => {
      cancelled = true
      unlistenPromise.then((fn) => fn())
    }
  }, [])

  return { progress, isAssembling, setIsAssembling }
}
