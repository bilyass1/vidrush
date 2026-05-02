'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  Youtube,
  ShoppingBag,
  Scissors,
  BarChart3,
  Settings,
  HardDrive,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: Home },
  { label: 'YouTube Gen', href: '/dashboard/youtube', icon: Youtube },
  { label: 'E-Commerce', href: '/dashboard/ecommerce', icon: ShoppingBag },
  { label: 'Video Editor', href: '/dashboard/editor', icon: Scissors },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [ffmpegOk, setFfmpegOk] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const found = await invoke<boolean>('check_ffmpeg')
        setFfmpegOk(found)
      } catch {
        // Not in Tauri — assume ok
        setFfmpegOk(true)
      }
    }
    check()
  }, [])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-[220px] border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                active
                  ? 'bg-purple-600/10 text-purple-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-purple-500 rounded-r" />
              )}
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-zinc-800 space-y-3">
        {/* Storage indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <HardDrive size={14} />
          <span>2.3 GB used</span>
        </div>

        {/* FFmpeg status */}
        {ffmpegOk !== null && (
          <div className="flex items-center gap-2 text-xs">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                ffmpegOk ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className={ffmpegOk ? 'text-zinc-500' : 'text-red-400'}>
              FFmpeg {ffmpegOk ? 'ready' : 'missing'}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
