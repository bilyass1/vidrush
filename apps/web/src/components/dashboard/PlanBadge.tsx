'use client'

import { cn } from '@/lib/utils'
import type { Plan } from '@vidrush/shared'

const planColors: Record<Plan, string> = {
  FREE: 'bg-zinc-700 text-zinc-300',
  STARTER: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
  PRO: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
  PAYG: 'bg-orange-600/20 text-orange-400 border border-orange-500/30',
}

interface PlanBadgeProps {
  plan: Plan
  className?: string
}

export default function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        planColors[plan],
        className
      )}
    >
      {plan}
    </span>
  )
}
