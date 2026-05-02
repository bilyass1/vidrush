import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog'

// ── Types (snake_case to match Rust serde defaults) ─────────────────────────

export interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  size_bytes: number
  format: string
}

export interface Cut {
  start_sec: number
  end_sec: number
}

export interface Overlay {
  overlay_type: 'text' | 'image'
  x: number
  y: number
  content: string
  start_t: number
  end_t: number
  font_size?: number
  color?: string
}

export interface AudioTrack {
  path: string
  start_t: number
  offset_t: number
  duration: number
  volume: number
}

export interface ExportInstructions {
  input_path: string
  output_path: string
  cuts: Cut[]
  overlays: Overlay[]
  volume: number
  speed: number
  format: 'mp4' | 'webm'
  output_width?: number
  output_height?: number
  target_fps?: number
  crf?: number
  audio_bitrate?: string
  audio_tracks?: AudioTrack[]
}

// ── Commands ────────────────────────────────────────────────────────────────

export const tauriCommands = {
  getAppVersion: () => invoke<string>('get_app_version'),
  openFolder: (path: string) => invoke<void>('open_folder', { path }),
  checkFfmpeg: () => invoke<boolean>('check_ffmpeg'),
}

export const ffmpegCommands = {
  getVideoInfo: (videoPath: string) =>
    invoke<VideoInfo>('get_video_info', { videoPath }),

  extractThumbnails: (videoPath: string, outputDir: string, count: number) =>
    invoke<string[]>('extract_thumbnails', { videoPath, outputDir, count }),

  cutVideo: (inputPath: string, outputPath: string, startSec: number, endSec: number) =>
    invoke<void>('cut_video', { inputPath, outputPath, startSec, endSec }),

  exportWithEffects: (instructions: ExportInstructions) =>
    invoke<string>('export_with_effects', { instructions }),
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function listenExportProgress(callback: (progress: number) => void): Promise<UnlistenFn> {
  return listen<number>('export_progress', (evt) => callback(evt.payload))
}

export function listenExportLog(callback: (line: string) => void): Promise<UnlistenFn> {
  return listen<string>('export_log', (evt) => callback(evt.payload))
}

export async function pickVideoFile(): Promise<string | null> {
  const selected = await openDialog({
    multiple: false,
    filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'mov', 'mkv', 'avi'] }],
  })
  return typeof selected === 'string' ? selected : null
}

export async function pickSavePath(defaultName: string): Promise<string | null> {
  const selected = await saveDialog({
    defaultPath: defaultName,
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'WebM Video', extensions: ['webm'] },
    ],
  })
  return typeof selected === 'string' ? selected : null
}

/** Convert a local file path to a Tauri asset URL for <img>/<video> src.
 *  HTTP/HTTPS URLs are returned unchanged. */
export function assetUrl(localPath: string): string {
  if (!localPath) return ''
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) return localPath
  return convertFileSrc(localPath)
}

/** Extract the directory portion of a file path. */
export function dirOf(filePath: string): string {
  return filePath.replace(/[/\\][^/\\]+$/, '')
}

// ── Assembly types (free pipeline) ──────────────────────────────────────────

export interface AssemblyInstructions {
  scenes: {
    footagePath: string
    startSec: number
    durationSec: number
    sfxPath: string | null
    sfxVolume: number
    transition: 'fade' | 'cut' | 'dissolve'
  }[]
  voicePath: string
  musicPaths: string[]
  outputPath: string
  totalDuration: number
  style: string
}

export interface AssemblyResult {
  outputPath: string
  duration: number
  success: boolean
  error?: string
}

export function onAssemblyProgress(callback: (percent: number) => void): Promise<UnlistenFn> {
  return listen<number>('assembly_progress', (event) => {
    callback(event.payload)
  })
}
