import { invoke } from '@tauri-apps/api/core'

// ── Existing commands ─────────────────────────────────────────────────────────

export const tauriCommands = {
  getAppVersion: () => invoke<string>('get_app_version'),
  saveFile: (path: string, data: Uint8Array) =>
    invoke<void>('save_file', { path, data }),
  openFolder: (path: string) =>
    invoke<void>('open_folder', { path }),
  sendNotification: (title: string, body: string) =>
    invoke<void>('send_notification', { title, body }),
  checkFfmpeg: () => invoke<boolean>('check_ffmpeg'),
}

// ── FFmpeg types ──────────────────────────────────────────────────────────────

export interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  sizeBytes: number
  format: string
}

export interface ExportInstructions {
  inputPath: string
  outputPath: string
  cuts: { startSec: number; endSec: number }[]
  overlays: {
    overlayType: 'text' | 'image'
    x: number
    y: number
    content: string
    startT: number
    endT: number
    fontSize?: number
    color?: string
  }[]
  volume: number
  speed: number
  format: 'mp4' | 'webm'
}

// ── FFmpeg commands ───────────────────────────────────────────────────────────

export const ffmpegCommands = {
  getFfmpegPath: () =>
    invoke<string>('get_ffmpeg_path'),

  getVideoInfo: (videoPath: string) =>
    invoke<VideoInfo>('get_video_info', { videoPath }),

  extractThumbnails: (videoPath: string, outputDir: string, count: number) =>
    invoke<string[]>('extract_thumbnails', { videoPath, outputDir, count }),

  cutVideo: (
    inputPath: string,
    outputPath: string,
    startSec: number,
    endSec: number,
  ) =>
    invoke<void>('cut_video', { inputPath, outputPath, startSec, endSec }),

  exportWithEffects: (instructions: ExportInstructions) =>
    invoke<string>('export_with_effects', { instructions }),
}
