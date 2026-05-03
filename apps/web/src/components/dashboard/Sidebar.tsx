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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 transition-all duration-300',
          // Desktop
          'hidden lg:flex',
          isCollapsed ? 'lg:w-[70px]' : 'lg:w-[220px]',
          // Mobile
          'lg:relative fixed inset-y-0 left-0 z-40',
          isMobileOpen ? 'flex w-[260px]' : 'hidden lg:flex'
        )}
      >
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-10"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

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
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
                  isCollapsed && 'lg:justify-center'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-purple-500 rounded-r" />
                )}
                <item.icon size={18} className="shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        {!isCollapsed && (
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
        )}

        {/* Collapsed bottom indicators */}
        {isCollapsed && (
          <div className="p-3 border-t border-zinc-800 flex flex-col items-center gap-3">
            <HardDrive size={16} className="text-zinc-500" />
            {ffmpegOk !== null && (
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  ffmpegOk ? 'bg-green-500' : 'bg-red-500'
                )}
              />
            )}
          </div>
        )}
      </aside>
    </>
  )
}
