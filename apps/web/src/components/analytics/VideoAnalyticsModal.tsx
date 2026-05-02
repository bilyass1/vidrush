'use client'

import { useEffect, useState } from 'react'
import { X, Eye, Clock, ThumbsUp, Users, TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { youtube } from '@/lib/api'
import type { VideoAnalytics } from '@/lib/api'

interface Props {
  youtubeVideoId: string
  title: string
  isOpen: boolean
  onClose: () => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Eye
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
      <div className={`inline-flex p-2 rounded-lg ${color}`}>
        <Icon size={14} />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

export default function VideoAnalyticsModal({ youtubeVideoId, title, isOpen, onClose }: Props) {
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    youtube.getVideoAnalytics(youtubeVideoId)
      .then(setAnalytics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [isOpen, youtubeVideoId])

  if (!isOpen) return null

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-white font-semibold text-sm truncate max-w-[80%]">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors ml-2 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-800">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            >
              <span className="text-white text-sm font-medium bg-red-600 px-4 py-2 rounded-lg">
                View on YouTube
              </span>
            </a>
          </div>

          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-xl h-24" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {analytics && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={fmt(analytics.views)}
                  color="bg-blue-500/10 text-blue-400"
                />
                <StatCard
                  icon={Clock}
                  label="Watch Time"
                  value={`${Math.round(analytics.watchTime / 60)}h`}
                  color="bg-purple-500/10 text-purple-400"
                />
                <StatCard
                  icon={ThumbsUp}
                  label="Likes"
                  value={fmt(analytics.likes)}
                  color="bg-green-500/10 text-green-400"
                />
                <StatCard
                  icon={Users}
                  label="Subs Gained"
                  value={fmt(analytics.subscribersGained)}
                  color="bg-orange-500/10 text-orange-400"
                />
              </div>

              {/* CTR */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-zinc-500" />
                <span className="text-zinc-400">Avg Click-Through Rate:</span>
                <span className={cn(
                  'font-bold',
                  analytics.ctr > 5 ? 'text-green-400' : analytics.ctr >= 2 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {analytics.ctr.toFixed(2)}%
                </span>
              </div>

              {/* Views chart */}
              {analytics.dailyStats.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Views — Last 30 Days</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyStats} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          tickFormatter={(v: string) => v.slice(5)}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                        <Tooltip
                          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                          labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                          itemStyle={{ color: '#a855f7' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#a855f7"
                          strokeWidth={2}
                          fill="url(#viewsGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No daily data available for the last 30 days.
                </div>
              )}

              {/* Retention placeholder */}
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center space-y-1">
                <p className="text-sm text-zinc-400 font-medium">Audience Retention</p>
                <p className="text-xs text-zinc-600">Retention data coming soon — requires YouTube Analytics advanced access.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
