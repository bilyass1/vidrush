'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import { NeuralLoader } from '@/components/NeuralLoader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const { stats } = useStats()
  const router = useRouter()
  const pathname = usePathname()
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    async function getVersion() {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const version = await invoke<string>('get_app_version')
        setAppVersion(version)
      } catch {
        setAppVersion('dev')
      }
    }
    getVersion()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return <NeuralLoader />
  }

  if (!user) return null

  // Editor is full-screen — skip sidebar and topbar
  if (pathname === '/dashboard/editor') {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <TopBar stats={stats} appVersion={appVersion} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
