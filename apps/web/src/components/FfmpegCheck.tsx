'use client'

import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { AlertCircle, RefreshCw, Download } from 'lucide-react'

export default function FfmpegCheck() {
  const [missing, setMissing] = useState(false)
  const [checking, setChecking] = useState(false)

  const check = useCallback(async () => {
    setChecking(true)
    try {
      const found = await invoke<boolean>('check_ffmpeg')
      setMissing(!found)
    } catch {
      // Not running in Tauri — ignore
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    check()
    // Poll every 5 seconds if missing
    let interval: NodeJS.Timeout
    if (missing) {
      interval = setInterval(check, 5000)
    }
    return () => clearInterval(interval)
  }, [check, missing])

  if (!missing) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between bg-[#111111]/90 backdrop-blur-md border border-yellow-500/20 rounded-2xl p-4 shadow-2xl shadow-yellow-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Dependency Missing</h3>
            <p className="text-xs text-gray-400">FFmpeg is required for video editing. We couldn&apos;t find it on your system.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => check()}
            disabled={checking}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check again'}
          </button>
          
          <a
            href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-[#0a0a0a] hover:bg-yellow-400 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
