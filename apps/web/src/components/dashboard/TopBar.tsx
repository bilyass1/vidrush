'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, ChevronDown, User, CreditCard, LogOut } from 'lucide-react'
import PlanBadge from './PlanBadge'
import UsageBar from './UsageBar'
import { useAuth } from '@/hooks/useAuth'
import type { DashboardStats } from '@/lib/api'
import type { Plan } from '@vidrush/shared'

interface TopBarProps {
  stats: DashboardStats | null
  appVersion: string
}

export default function TopBar({ stats, appVersion }: TopBarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center px-5 shrink-0 z-30">
      {/* Left: Logo + version */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="font-bold text-white text-base">VidRush</span>
        </div>
        {appVersion && (
          <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
            v{appVersion}
          </span>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-auto px-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search videos, projects..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Right: Usage + Plan + Bell + Avatar */}
      <div className="flex items-center gap-4">
        {stats && (
          <UsageBar
            used={stats.minutesUsed}
            limit={stats.minutesLimit}
            plan={user?.plan ?? 'FREE'}
            compact
          />
        )}

        {user && <PlanBadge plan={user.plan as Plan} />}

        <button className="relative text-zinc-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-zinc-800">
          <Bell size={18} />
        </button>

        {/* Avatar dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/30 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-zinc-800">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  router.push('/dashboard/settings')
                  setDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard/settings?tab=billing')
                  setDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <CreditCard size={15} /> Billing
              </button>
              <div className="border-t border-zinc-800 mt-1 pt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
