'use client'

import { useEffect, useState } from 'react'
import { Youtube, Eye, Clock, ThumbsUp, Users, ExternalLink, BarChart2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { youtube, video } from '@/lib/api'
import type { ChannelInfo, ChannelAnalytics } from '@/lib/api'
import type { VideoGeneration } from '@vidrush/shared'
import VideoAnalyticsModal from '@/components/analytics/VideoAnalyticsModal'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function relativeDate(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

interface ModalState {
  youtubeVideoId: string
  title: string
}

export default function AnalyticsPage() {
  const [channel, setChannel] = useState<ChannelInfo | null | undefined>(undefined)
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null)
  const [publishedVideos, setPublishedVideos] = useState<VideoGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const ch = await youtube.getChannel()
        setChannel(ch)
        if (ch) {
          const [analyticsData, videos] = await Promise.all([
            youtube.getChannelAnalytics(),
            video.recent(50),
          ])
          setAnalytics(analyticsData)
          setPublishedVideos(videos.filter((v) => v.youtubeVideoId))
        }
      } catch {
        setChannel(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleConnect = async () => {
    setConnectLoading(true)
    try {
      const { url } = await youtube.getAuthUrl()
      window.location.href = url
    } catch {
      setConnectLoading(false)
    }
  }

  // Not connected state
  if (!loading && !channel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mx-auto">
            <Youtube size={32} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Connect your YouTube channel</h2>
            <p className="text-sm text-zinc-500">
              See analytics for all your published videos and track channel growth over time.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connectLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Youtube size={16} />
            {connectLoading ? 'Redirecting...' : 'Connect YouTube'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">YouTube Analytics</h1>
          {channel && (
            <p className="text-zinc-400 text-sm mt-1">
              {channel.name} &bull; {channel.subscriberCount.toLocaleString()} subscribers
            </p>
          )}
        </div>
        <span className="text-xs text-zinc-600 uppercase tracking-widest">Last 30 days</span>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Eye}
            label="Total Views"
            value={fmt(analytics.totalViews)}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={Clock}
            label="Watch Time"
            value={`${Math.round(analytics.totalWatchTime / 60)}h`}
            color="text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatsCard
            icon={ThumbsUp}
            label="Total Likes"
            value={fmt(analytics.totalLikes)}
            color="text-green-400"
            bg="bg-green-500/10"
          />
          <StatsCard
            icon={Users}
            label="New Subscribers"
            value={fmt(analytics.totalSubscribersGained)}
            color="text-orange-400"
            bg="bg-orange-500/10"
          />
        </div>
      ) : null}

      {/* Views chart */}
      {analytics && analytics.dailyStats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Views Over Time</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyStats} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="channelViewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
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
                  fill="url(#channelViewsGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Published Videos table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold">Published Videos</h2>
        </div>

        {publishedVideos.length === 0 && !loading ? (
          <div className="py-16 text-center space-y-3">
            <Youtube size={32} className="mx-auto text-zinc-700" />
            <p className="text-zinc-500 font-medium">No published videos yet</p>
            <p className="text-zinc-600 text-sm">Publish your first video from the YouTube Generator</p>
            <a
              href="/dashboard/youtube"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Go to Generator
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wide font-medium">Video</th>
                  <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wide font-medium">Published</th>
                  <th className="px-4 py-3 text-right text-xs text-zinc-500 uppercase tracking-wide font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publishedVideos.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://img.youtube.com/vi/${v.youtubeVideoId}/mqdefault.jpg`}
                          alt={v.inputPrompt}
                          className="w-20 h-12 object-cover rounded-lg bg-zinc-800 shrink-0"
                        />
                        <span className="text-zinc-200 truncate max-w-[240px]">
                          {v.inputPrompt.length > 40 ? v.inputPrompt.slice(0, 40) + '…' : v.inputPrompt}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {relativeDate(v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ youtubeVideoId: v.youtubeVideoId!, title: v.inputPrompt })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <BarChart2 size={12} /> Details
                        </button>
                        <a
                          href={v.youtubeUrl ?? `https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <ExternalLink size={12} /> YouTube
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VideoAnalyticsModal */}
      {modal && (
        <VideoAnalyticsModal
          youtubeVideoId={modal.youtubeVideoId}
          title={modal.title}
          isOpen={!!modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Eye
  label: string
  value: string
  color: string
  bg: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      <div className={`inline-flex p-2.5 rounded-xl ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
