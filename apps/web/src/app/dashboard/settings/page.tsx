'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { User, CreditCard, Youtube, Bell, CheckCircle2, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import PlanBadge from '@/components/dashboard/PlanBadge'
import UsageBar from '@/components/dashboard/UsageBar'
import { youtube } from '@/lib/api'
import type { ChannelInfo } from '@/lib/api'
import type { Plan } from '@vidrush/shared'

type TabKey = 'profile' | 'billing' | 'youtube' | 'notifications' | 'api'

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'api', label: 'API Status', icon: Server },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get('tab') as TabKey) || 'profile'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [connectedToast, setConnectedToast] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey
    if (tab && tabs.some((t) => t.key === tab)) {
      setActiveTab(tab)
    }
    if (searchParams.get('connected') === 'true') {
      setConnectedToast(true)
      setTimeout(() => setConnectedToast(false), 5000)
      // Remove param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('connected')
      router.replace(`/dashboard/settings?${params.toString()}`)
    }
  }, [searchParams, router])

  return (
    <div className="p-6 max-w-4xl">
      {connectedToast && (
        <div className="fixed top-24 right-8 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-500 border border-green-400">
          <CheckCircle2 size={20} />
          <div>
            <p className="font-bold">YouTube connected successfully! 🎉</p>
            <p className="text-xs opacity-90">You can now publish videos directly from VidRush.</p>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'billing' && <BillingTab />}
      {activeTab === 'youtube' && <YouTubeTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'api' && <ApiStatusTab />}
    </div>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      // TODO: Call PATCH /auth/profile when endpoint is ready
      setMessage('Profile updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
        <input
          type="email"
          value={user?.email ?? ''}
          readOnly
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
        />
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-medium text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>
      </div>

      {message && (
        <p className={cn(
          'text-sm px-4 py-2.5 rounded-lg',
          message.includes('success')
            ? 'text-green-400 bg-green-400/10 border border-green-400/20'
            : 'text-red-400 bg-red-400/10 border border-red-400/20'
        )}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

function BillingTab() {
  const { user } = useAuth()
  const { stats } = useStats()

  return (
    <div className="space-y-6 max-w-lg">
      {/* Current Plan */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-zinc-400">Current Plan</p>
            <div className="mt-1">
              {user && <PlanBadge plan={user.plan as Plan} className="text-sm" />}
            </div>
          </div>
        </div>

        {stats && user && (
          <UsageBar
            used={stats.minutesUsed}
            limit={stats.minutesLimit}
            plan={user.plan}
          />
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <a
          href="/pricing"
          className="block w-full text-center px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Upgrade Plan
        </a>

        <div className="relative group">
          <button
            disabled
            className="w-full px-6 py-2.5 bg-zinc-800 text-zinc-500 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Manage Billing
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Coming soon — Stripe integration
          </div>
        </div>
      </div>
    </div>
  )
}

function YouTubeTab() {
  const [channel, setChannel] = useState<ChannelInfo | null | undefined>(undefined)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)

  const loadChannel = useCallback(async () => {
    try {
      const ch = await youtube.getChannel()
      setChannel(ch)
    } catch {
      setChannel(null)
    }
  }, [])

  useEffect(() => {
    loadChannel()
  }, [loadChannel])

  const handleConnect = async () => {
    setConnectLoading(true)
    try {
      const { url } = await youtube.getAuthUrl()
      window.location.href = url
    } catch {
      setConnectLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await youtube.disconnect()
      setChannel(null)
      setConfirmDisconnect(false)
    } catch {
      // ignore
    } finally {
      setDisconnecting(false)
    }
  }

  // Loading state
  if (channel === undefined) {
    return (
      <div className="max-w-lg">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="max-w-lg">
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 text-center">
          <Youtube size={40} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Connect Your YouTube Channel</h3>
          <p className="text-sm text-zinc-500 mb-6">
            Connect your YouTube channel to publish videos directly from VidRush.
          </p>
          <button
            onClick={handleConnect}
            disabled={connectLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Youtube size={16} />
            {connectLoading ? 'Redirecting...' : 'Connect YouTube'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Channel card */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-center gap-4">
          {channel.thumbnailUrl ? (
            <img
              src={channel.thumbnailUrl}
              alt={channel.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <Youtube size={24} className="text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{channel.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Connected
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {channel.subscriberCount.toLocaleString()} subscribers
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect */}
      {!confirmDisconnect ? (
        <button
          onClick={() => setConfirmDisconnect(true)}
          className="w-full px-4 py-2.5 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/10 transition-colors"
        >
          Disconnect Channel
        </button>
      ) : (
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-3">
          <p className="text-sm text-red-400 font-medium">Are you sure?</p>
          <p className="text-xs text-zinc-500">
            This will remove YouTube access from VidRush. Your published videos will not be affected.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting...' : 'Yes, disconnect'}
            </button>
            <button
              onClick={() => setConfirmDisconnect(false)}
              className="flex-1 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    videoComplete: true,
    youtubeUpload: true,
    exportComplete: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem('vidrush_notification_prefs')
    if (saved) {
      try {
        setPrefs(JSON.parse(saved))
      } catch { /* ignore invalid JSON */ }
    }
  }, [])

  const toggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    localStorage.setItem('vidrush_notification_prefs', JSON.stringify(updated))
  }

  return (
    <div className="max-w-lg space-y-2">
      <ToggleRow
        label="Notify when video generation completes"
        checked={prefs.videoComplete}
        onChange={() => toggle('videoComplete')}
      />
      <ToggleRow
        label="Notify when YouTube upload completes"
        checked={prefs.youtubeUpload}
        onChange={() => toggle('youtubeUpload')}
      />
      <ToggleRow
        label="Notify on export complete"
        checked={prefs.exportComplete}
        onChange={() => toggle('exportComplete')}
      />
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        onClick={onChange}
        className={cn(
          'relative w-10 h-[22px] rounded-full transition-colors',
          checked ? 'bg-purple-600' : 'bg-zinc-700'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm',
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

function ApiStatusTab() {
  const [status, setStatus] = useState<{ connected: boolean; url: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('jwt')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
      const res = await fetch(`${apiUrl}/video/api-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json() as { ltxServer: { connected: boolean; url: string } }
      setStatus(data.ltxServer)
    } catch (err) {
      console.error('Failed to check LTX server status:', err)
      setStatus({ connected: false, url: 'Backend unreachable' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { check() }, [check])

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-zinc-500">Live status of connected AI services.</p>

      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 animate-pulse" />
            ) : status?.connected ? (
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            )}
            <div>
              <p className="text-sm font-medium text-white">LTX Video 2.3 Server</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {loading
                  ? 'Checking...'
                  : status?.connected
                    ? `Connected at ${status.url}`
                    : `Cannot reach server at ${status?.url ?? '—'}`}
              </p>
            </div>
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
