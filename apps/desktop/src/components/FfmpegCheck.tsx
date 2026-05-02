'use client'

import { useEffect, useState } from 'react'
import { open } from '@tauri-apps/plugin-shell'
import { tauriCommands } from '../lib/tauri'

export default function FfmpegCheck() {
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    tauriCommands.checkFfmpeg().then((found) => {
      setMissing(!found)
    })
  }, [])

  if (!missing) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm text-black">
      <span>
        FFmpeg not detected. Download it to use the Video Editor.
      </span>
      <button
        onClick={() => open('https://ffmpeg.org/download.html')}
        className="ml-4 font-semibold underline"
      >
        Download FFmpeg
      </button>
    </div>
  )
}
