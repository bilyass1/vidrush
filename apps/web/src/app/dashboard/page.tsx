'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Clock, Youtube, CalendarDays, Plus, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import StatsCard, { StatsCardSkeleton } from '@/components/dashboard/StatsCard'
import VideoCard, { VideoCardSkeleton } from '@/components/dashboard/VideoCard'
import PublishModal from '@/components/dashboard/PublishModal'
import UsageBar from '@/components/dashboard/UsageBar'
import type { VideoGeneration } from '@vidrush/shared'
import { VideoType } from '@vidrush/shared'

export default function DashboardOverview() {
  const router = useRouter()
  const { user } = useAuth()
  const { stats, recentVideos, isLoading, refetch } = useStats()
  const [publishingVideo, setPublishingVideo] = useState<VideoGeneration | null>(null)

  const handleDownload = (video: VideoGeneration) => {
    if (!video.outputUrl) return
    const a = document.createElement('a')
    a.href = video.outputUrl
    a.download = `${video.inputPrompt || 'video'}.mp4`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleOpenEditor = (video: VideoGeneration) => {
    if (video.outputUrl) {
      sessionStorage.setItem('editor_source', JSON.stringify({
        url: video.outputUrl,
        title: video.inputPrompt || 'Generated Video',
      }))
    }
    router.push('/dashboard/editor')
  }

  const handlePublish = (video: VideoGeneration) => {
    if (video.type === VideoType.YOUTUBE) setPublishingVideo(video)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-12 lg:pt-0">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Creator'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Here&apos;s what&apos;s happening with your videos.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              label="Videos Generated"
              value={stats?.totalVideos ?? 0}
              icon={<Video size={20} />}
            />
            <StatsCard
              label="Minutes Used"
              value={`${Math.round(stats?.minutesUsed ?? 0)}/${stats?.minutesLimit ?? 0}`}
              subtitle="this month"
              icon={<Clock size={20} />}
            />
            <StatsCard
              label="Published to YT"
              value={stats?.publishedCount ?? 0}
              icon={<Youtube size={20} />}
            />
            <StatsCard
              label="This Month"
              value={stats?.thisMonthCount ?? 0}
              icon={<CalendarDays size={20} />}
            />
          </>
        )}
      </div>

      {/* Recent Videos */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Videos</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
                onOpenEditor={handleOpenEditor}
                onPublish={handlePublish}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 sm:p-10 text-center">
            <Video size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">No videos yet. Create your first one below!</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/dashboard/youtube')}
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-950/20 transition-all group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-400 group-hover:bg-red-600/30 transition-colors shrink-0">
              <Plus size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-xs sm:text-sm truncate">New YouTube Video</p>
              <p className="text-xs text-zinc-500 truncate">Generate a full documentary</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/ecommerce')}
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/30 hover:bg-blue-950/20 transition-all group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors shrink-0">
              <Plus size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-xs sm:text-sm truncate">New E-Commerce Campaign</p>
              <p className="text-xs text-zinc-500 truncate">Create product ads</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/editor')}
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 hover:bg-purple-950/20 transition-all group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600/30 transition-colors shrink-0">
              <Upload size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-xs sm:text-sm truncate">Import Video to Editor</p>
              <p className="text-xs text-zinc-500 truncate">Edit with FFmpeg tools</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/script-engine')}
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-600/30 transition-colors shrink-0">
              <Plus size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-xs sm:text-sm truncate">AI Script Engine</p>
              <p className="text-xs text-zinc-500 truncate">Claude-powered script builder</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/video-test')}
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-green-500/30 hover:bg-green-950/20 transition-all group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-600/20 flex items-center justify-center text-green-400 group-hover:bg-green-600/30 transition-colors shrink-0">
              <Video size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-xs sm:text-sm truncate">LTX Video Test</p>
              <p className="text-xs text-zinc-500 truncate">Quick 2s generation test</p>
            </div>
          </button>
        </div>
      </section>

      {/* Usage Section */}
      {stats && user && (
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Usage</h2>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5">
            <UsageBar
              used={stats.minutesUsed}
              limit={stats.minutesLimit}
              plan={user.plan}
            />
          </div>
        </section>
      )}

      {publishingVideo && (
        <PublishModal
          video={publishingVideo}
          isOpen={!!publishingVideo}
          onClose={() => setPublishingVideo(null)}
          onPublished={() => {
            setPublishingVideo(null)
            refetch?.()
          }}
        />
      )}
    </div>
  )
}
