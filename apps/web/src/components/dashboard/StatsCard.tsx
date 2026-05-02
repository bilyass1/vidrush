'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
  className?: string
}

export default function StatsCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-700 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>
            {trend === 'up' ? '\u2191' : '\u2193'} {trendValue}
          </span>
          <span className="text-zinc-500">vs last month</span>
        </div>
      )}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-20 bg-zinc-800 rounded" />
        <div className="h-7 w-16 bg-zinc-800 rounded" />
        <div className="h-3 w-24 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}
