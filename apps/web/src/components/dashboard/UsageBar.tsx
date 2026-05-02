'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface UsageBarProps {
  used: number
  limit: number
  plan: string
  compact?: boolean
  className?: string
}

export default function UsageBar({ used, limit, plan, compact, className }: UsageBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 100)
    return () => clearTimeout(timer)
  }, [percentage])

  const barColor =
    percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
            style={{ width: `${animatedWidth}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400">
          {Math.round(used)}/{limit} min
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">
          {Math.round(used)} of {limit} minutes used this month
        </span>
        <span className="text-zinc-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
      {percentage > 80 && plan !== 'PAYG' && (
        <p className="text-xs text-yellow-400">
          Running low on minutes.{' '}
          <a href="/dashboard/settings?tab=billing" className="underline hover:text-yellow-300">
            Upgrade Plan
          </a>
        </p>
      )}
    </div>
  )
}
