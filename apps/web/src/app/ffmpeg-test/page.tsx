'use client'

import { useState } from 'react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// ── Local types (mirrors Rust structs, snake_case to match serde defaults) ────

interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  size_bytes: number
  format: string
}

interface ExportInstructions {
  input_path: string
  output_path: string
  cuts: { start_sec: number; end_sec: number }[]
  overlays: {
    overlay_type: 'text' | 'image'
    x: number
    y: number
    content: string
    start_t: number
    end_t: number
    font_size?: number
    color?: string
  }[]
  volume: number
  speed: number
  format: 'mp4' | 'webm'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dirOf(filePath: string) {
  return filePath.replace(/[/\\][^/\\]+$/, '')
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FfmpegTestPage() {
  const [videoPath, setVideoPath] = useState<string | null>(null)
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const [cutStatus, setCutStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState('')

  async function pickVideo() {
    setError('')
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'mov', 'mkv', 'avi'] }],
      })
      if (typeof selected === 'string') {
        setVideoPath(selected)
        setInfo(null)
        setThumbs([])
        setCutStatus('')
        setExportStatus('')
        setExportProgress(0)
      }
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleGetInfo() {
    if (!videoPath) return
    setError('')
    try {
      const result = await invoke<VideoInfo>('get_video_info', { videoPath })
      setInfo(result)
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleExtractThumbs() {
    if (!videoPath) return
    setError('')
    setThumbs([])
    try {
      const outputDir = dirOf(videoPath) + '/vidrush_thumbs'
      const paths = await invoke<string[]>('extract_thumbnails', {
        videoPath,
        outputDir,
        count: 5,
      })
      setThumbs(paths)
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleCut() {
    if (!videoPath) return
    setError('')
    setCutStatus('Cutting…')
    try {
      const outputPath = dirOf(videoPath) + '/test_cut.mp4'
      await invoke<void>('cut_video', {
        inputPath: videoPath,
        outputPath,
        startSec: 0,
        endSec: 10,
      })
      setCutStatus(`Done → ${outputPath}`)
    } catch (e) {
      setCutStatus('Failed')
      setError(String(e))
    }
  }

  async function handleExport() {
    if (!videoPath) return
    setError('')
    setExportProgress(0)
    setExportStatus('Exporting…')

    const unlisten = await listen<number>('export_progress', (evt) => {
      setExportProgress(evt.payload)
    })

    try {
      const instructions: ExportInstructions = {
        input_path: videoPath,
        output_path: dirOf(videoPath) + '/test_export.mp4',
        cuts: [],
        overlays: [],
        volume: 1.0,
        speed: 1.0,
        format: 'mp4',
      }
      const result = await invoke<string>('export_with_effects', { instructions })
      setExportStatus(`Done → ${result}`)
    } catch (e) {
      setExportStatus('Failed')
      setError(String(e))
    } finally {
      unlisten()
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-1">FFmpeg Test Page</h1>
      <p className="text-zinc-500 text-sm mb-8">Hidden from navigation — dev only</p>

      {/* File picker */}
      <section className="mb-8">
        <button
          onClick={pickVideo}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm"
        >
          Pick video…
        </button>
        {videoPath && (
          <p className="mt-2 text-zinc-400 text-xs break-all">{videoPath}</p>
        )}
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleGetInfo}
          disabled={!videoPath}
          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 px-4 py-2 rounded text-sm"
        >
          Get Info
        </button>
        <button
          onClick={handleExtractThumbs}
          disabled={!videoPath}
          className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 px-4 py-2 rounded text-sm"
        >
          Extract 5 Thumbnails
        </button>
        <button
          onClick={handleCut}
          disabled={!videoPath}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 px-4 py-2 rounded text-sm"
        >
          Cut 0s → 10s
        </button>
        <button
          onClick={handleExport}
          disabled={!videoPath}
          className="bg-orange-700 hover:bg-orange-600 disabled:opacity-40 px-4 py-2 rounded text-sm"
        >
          Export (no effects)
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 rounded p-3 text-red-300 text-sm break-all">
          {error}
        </div>
      )}

      {/* Video Info */}
      {info && (
        <section className="mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Video Info</h2>
          <pre className="bg-zinc-900 rounded p-4 text-sm text-green-400 overflow-auto">
            {JSON.stringify(info, null, 2)}
          </pre>
        </section>
      )}

      {/* Cut */}
      {cutStatus && (
        <section className="mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Cut</h2>
          <p className="text-sm text-zinc-300">{cutStatus}</p>
        </section>
      )}

      {/* Export */}
      {exportStatus && (
        <section className="mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Export</h2>
          <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <p className="text-sm text-zinc-300">
            {exportStatus}
            {exportProgress > 0 && exportProgress < 100 &&
              ` (${exportProgress.toFixed(0)}%)`}
          </p>
        </section>
      )}

      {/* Thumbnails */}
      {thumbs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-2">
            Thumbnails ({thumbs.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {thumbs.map((p, i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded overflow-hidden border border-zinc-800"
              >
                {/* Tauri asset protocol for local image files */}
                <img
                  src={`asset://localhost/${p.replace(/\\/g, '/').replace(/^\//, '')}`}
                  alt={`thumb ${i}`}
                  className="w-48 h-28 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <p
                  className="text-xs text-zinc-500 p-1 truncate max-w-[192px]"
                  title={p}
                >
                  thumb_{i}.jpg
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
