'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { tempDir } from '@tauri-apps/api/path'
import {
  ffmpegCommands,
  listenExportProgress,
  listenExportLog,
  dirOf,
  type VideoInfo,
  type ExportInstructions,
} from '@/lib/tauri'

// ── Types ────────────────────────────────────────────────────────────────────

export interface EditorCut {
  id: string
  startSec: number
  endSec: number
}

export interface EditorOverlay {
  id: string
  overlayType: 'text' | 'image'
  x: number              // % of container
  y: number              // % of container
  width: number          // % of container (0 = auto)
  height: number         // % of container (0 = auto)
  content: string
  startT: number
  endT: number
  fontSize: number
  color: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  background: 'none' | 'black50' | 'white50'
  zIndex: number
  // Effects
  shadow: boolean
  outline: boolean
  outlineColor: string
}

export interface EditorAudioTrack {
  id: string
  path: string
  name: string
  startT: number      // position on timeline
  offsetT: number     // start point within audio file
  duration: number
  volume: number
}

export interface EditorState {
  videoPath: string | null
  videoInfo: VideoInfo | null
  thumbnails: string[]
  currentTime: number
  duration: number
  isPlaying: boolean
  cuts: EditorCut[]
  overlays: EditorOverlay[]
  audioTracks: EditorAudioTrack[]
  selectedOverlayId: string | null
  selectedAudioId: string | null
  selectedOverlayIds: string[]
  volume: number
  speed: number
  isExporting: boolean
  exportProgress: number
  exportLog: string[]
  zoomLevel: 1 | 2 | 4 | 8
  snapToGrid: boolean
  showGrid: boolean
  pendingRestore: { savedAt: number; data: Partial<EditorState> } | null
}

// ── Initial state ────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 20

const initialState: EditorState = {
  videoPath: null,
  videoInfo: null,
  thumbnails: [],
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  cuts: [],
  overlays: [],
  audioTracks: [],
  selectedOverlayId: null,
  selectedAudioId: null,
  selectedOverlayIds: [],
  volume: 1.0,
  speed: 1.0,
  isExporting: false,
  exportProgress: 0,
  exportLog: [],
  zoomLevel: 1,
  snapToGrid: false,
  showGrid: false,
  pendingRestore: null,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID()
}

function localStorageKey(videoPath: string): string {
  // Use a hash or just the filename for the key
  const name = videoPath.split(/[/\\]/).pop() || 'new_project'
  return `editor_project_${name}`
}

/** The subset of state persisted to localStorage (no transient UI props). */
type PersistedState = Pick<EditorState, 'cuts' | 'overlays' | 'volume' | 'speed'>

function extractPersistable(s: EditorState): PersistedState {
  return { cuts: s.cuts, overlays: s.overlays, volume: s.volume, speed: s.speed }
}

function mergeCuts(cuts: EditorCut[], newCut: EditorCut): EditorCut[] {
  const overlapping = cuts.filter(
    (c) => c.startSec < newCut.endSec && c.endSec > newCut.startSec
  )
  if (overlapping.length === 0) {
    return [...cuts, newCut]
  }
  const merged: EditorCut = {
    id: uuid(),
    startSec: Math.min(newCut.startSec, ...overlapping.map((c) => c.startSec)),
    endSec: Math.max(newCut.endSec, ...overlapping.map((c) => c.endSec)),
  }
  return [...cuts.filter((c) => !overlapping.includes(c)), merged]
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEditor() {
  const [state, setStateRaw] = useState<EditorState>(initialState)

  // Synchronous ref to always get current state in callbacks
  const stateRef = useRef<EditorState>(initialState)

  // Undo / redo stacks
  const undoStack = useRef<EditorState[]>([])
  const redoStack = useRef<EditorState[]>([])

  // Auto-save debounce timer
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Core setState ────────────────────────────────────────────────────────

  const setState = useCallback(
    (updater: EditorState | ((prev: EditorState) => EditorState)) => {
      setStateRaw((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : updater
        stateRef.current = next
        return next
      })
    },
    []
  )

  // ── Auto-save side effect ────────────────────────────────────────────────

  useEffect(() => {
    const s = state
    if (!s.videoPath || s.isExporting) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          localStorageKey(s.videoPath!),
          JSON.stringify({ savedAt: Date.now(), data: extractPersistable(s) })
        )
      } catch {
        // quota exceeded — ignore
      }
    }, 2000)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [
    state.cuts,
    state.overlays,
    state.volume,
    state.speed,
    state.videoPath,
    state.isExporting,
  ])

  // ── History helpers ──────────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    undoStack.current = [
      ...undoStack.current.slice(-(HISTORY_LIMIT - 1)),
      stateRef.current,
    ]
    redoStack.current = []
  }, [])

  // ── Undo / Redo ──────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current = [...redoStack.current.slice(-(HISTORY_LIMIT - 1)), stateRef.current]
    setState(prev)
  }, [setState])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current = [...undoStack.current.slice(-(HISTORY_LIMIT - 1)), stateRef.current]
    setState(next)
  }, [setState])

  const clearProjects = useCallback(() => {
    setState((s) => ({ ...s, videoPath: null, videoInfo: null, cuts: [], overlays: [] }))
  }, [setState])

  // ── Keyboard shortcuts (global) ──────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const s = stateRef.current

      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        redo()
        return
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          setState((s) => ({ ...s, isPlaying: !s.isPlaying }))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setState((s) => ({
            ...s,
            currentTime: Math.max(0, s.currentTime - (e.shiftKey ? 10 : 1)),
          }))
          break
        case 'ArrowRight':
          e.preventDefault()
          setState((s) => ({
            ...s,
            currentTime: Math.min(s.duration, s.currentTime + (e.shiftKey ? 10 : 1)),
          }))
          break
        case '[':
          e.preventDefault()
          // Set cut start — sets a pending cut start marker via a temporary state prop
          setState((s) => ({ ...s, _cutStartMark: s.currentTime } as EditorState & { _cutStartMark?: number }))
          break
        case ']': {
          e.preventDefault()
          const cutStart = (stateRef.current as EditorState & { _cutStartMark?: number })._cutStartMark
          if (cutStart !== undefined && cutStart < s.currentTime) {
            pushHistory()
            setState((prev) => ({
              ...prev,
              cuts: mergeCuts(prev.cuts, { id: uuid(), startSec: cutStart, endSec: prev.currentTime }),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any))
          }
          break
        }
        case 'Delete':
        case 'Backspace':
          if (s.selectedOverlayIds.length > 0) {
            e.preventDefault()
            pushHistory()
            setState((prev) => ({
              ...prev,
              overlays: prev.overlays.filter((o) => !prev.selectedOverlayIds.includes(o.id)),
              selectedOverlayId: null,
              selectedOverlayIds: [],
            }))
          }
          break
        case 'd':
        case 'D':
          if (e.ctrlKey && s.selectedOverlayId) {
            e.preventDefault()
            const orig = s.overlays.find((o) => o.id === s.selectedOverlayId)
            if (orig) {
              pushHistory()
              const dup: EditorOverlay = { ...orig, id: uuid(), x: orig.x + 2, y: orig.y + 2 }
              setState((prev) => ({
                ...prev,
                overlays: [...prev.overlays, dup],
                selectedOverlayId: dup.id,
                selectedOverlayIds: [dup.id],
              }))
            }
          }
          break
        case 'Escape':
          setState((s) => ({ ...s, selectedOverlayId: null, selectedOverlayIds: [] }))
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, pushHistory, setState])

  // ── Video loading ────────────────────────────────────────────────────────

  const loadVideo = useCallback(
    async (inputPath: string) => {
      try {
        // If it's an HTTP URL (backend local storage), download to a temp file first
        let path = inputPath
        if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
          const tmp = await tempDir()
          const filename = inputPath.split('/').pop()?.split('?')[0] || 'video.mp4'
          // Use backslash separator for Windows temp path
          const sep = tmp.endsWith('\\') || tmp.endsWith('/') ? '' : '\\'
          const localPath = `${tmp}${sep}vidrush_${Date.now()}_${filename}`

          const res = await fetch(inputPath)
          if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`)
          const buf = await res.arrayBuffer()
          await invoke('save_file', { path: localPath, data: Array.from(new Uint8Array(buf)) })
          path = localPath
        }

        // Check localStorage for saved project
        const saved = localStorage.getItem(localStorageKey(path))
        let pendingRestore: EditorState['pendingRestore'] = null
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as { savedAt: number; data: Partial<EditorState> }
            pendingRestore = parsed
          } catch {
            // corrupt — ignore
          }
        }

        const info = await ffmpegCommands.getVideoInfo(path)
        const thumbDir = dirOf(path) + '\\vidrush_thumbs'
        const thumbs = await ffmpegCommands.extractThumbnails(path, thumbDir, 16)

        setState({
          ...initialState,
          videoPath: path,
          videoInfo: info,
          thumbnails: thumbs,
          duration: info.duration,
          pendingRestore,
        })
        undoStack.current = []
        redoStack.current = []
      } catch (err) {
        console.error('Failed to load video:', err)
      }
    },
    [setState]
  )

  const restoreFromSave = useCallback(() => {
    const s = stateRef.current
    if (!s.pendingRestore) return
    const { data } = s.pendingRestore
    setState((prev) => ({
      ...prev,
      ...(data.cuts !== undefined ? { cuts: data.cuts } : {}),
      ...(data.overlays !== undefined ? { overlays: data.overlays } : {}),
      ...(data.volume !== undefined ? { volume: data.volume } : {}),
      ...(data.speed !== undefined ? { speed: data.speed } : {}),
      pendingRestore: null,
    }))
  }, [setState])

  const dismissRestore = useCallback(() => {
    setState((s) => ({ ...s, pendingRestore: null }))
  }, [setState])

  // ── Playback ─────────────────────────────────────────────────────────────

  const play = useCallback(() => setState((s) => ({ ...s, isPlaying: true })), [setState])
  const pause = useCallback(() => setState((s) => ({ ...s, isPlaying: false })), [setState])
  const seek = useCallback(
    (seconds: number) => setState((s) => ({ ...s, currentTime: Math.max(0, Math.min(s.duration, seconds)) })),
    [setState]
  )

  // ── Cuts ─────────────────────────────────────────────────────────────────

  const addCut = useCallback(
    (startSec: number, endSec: number) => {
      if (endSec <= startSec) return
      pushHistory()
      setState((s) => ({
        ...s,
        cuts: mergeCuts(s.cuts, { id: uuid(), startSec, endSec }),
      }))
    },
    [pushHistory, setState]
  )

  const removeCut = useCallback(
    (id: string) => {
      pushHistory()
      setState((s) => ({ ...s, cuts: s.cuts.filter((c) => c.id !== id) }))
    },
    [pushHistory, setState]
  )

  const updateCut = useCallback(
    (id: string, startSec: number, endSec: number) => {
      pushHistory()
      setState((s) => ({
        ...s,
        cuts: s.cuts.map((c) => (c.id === id ? { ...c, startSec, endSec } : c)),
      }))
    },
    [pushHistory, setState]
  )

  // ── Overlays ─────────────────────────────────────────────────────────────

  const addOverlay = useCallback(
    (overlay: Omit<EditorOverlay, 'id' | 'shadow' | 'outline' | 'outlineColor'>) => {
      pushHistory()
      const id = uuid()
      setState((s) => ({
        ...s,
        overlays: [...s.overlays, { 
          ...overlay, 
          id, 
          shadow: true, 
          outline: false, 
          outlineColor: '#000000' 
        }],
        selectedOverlayId: id,
        selectedOverlayIds: [id],
      }))
    },
    [pushHistory, setState]
  )

  const updateOverlay = useCallback(
    (id: string, partial: Partial<EditorOverlay>) => {
      setState((s) => ({
        ...s,
        overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...partial } : o)),
      }))
    },
    [setState]
  )

  const updateOverlayWithHistory = useCallback(
    (id: string, partial: Partial<EditorOverlay>) => {
      pushHistory()
      setState((s) => ({
        ...s,
        overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...partial } : o)),
      }))
    },
    [pushHistory, setState]
  )

  const removeOverlay = useCallback(
    (id: string) => {
      pushHistory()
      setState((s) => ({
        ...s,
        overlays: s.overlays.filter((o) => o.id !== id),
        selectedOverlayId: s.selectedOverlayId === id ? null : s.selectedOverlayId,
        selectedOverlayIds: s.selectedOverlayIds.filter((i) => i !== id),
      }))
    },
    [pushHistory, setState]
  )

  const removeSelectedOverlays = useCallback(() => {
    pushHistory()
    setState((s) => ({
      ...s,
      overlays: s.overlays.filter((o) => !s.selectedOverlayIds.includes(o.id)),
      selectedOverlayId: null,
      selectedOverlayIds: [],
    }))
  }, [pushHistory, setState])

  const selectOverlay = useCallback(
    (id: string | null, addToSelection = false) => {
      setState((s) => {
        if (id === null) return { ...s, selectedOverlayId: null, selectedOverlayIds: [] }
        if (addToSelection) {
          const already = s.selectedOverlayIds.includes(id)
          const newIds = already
            ? s.selectedOverlayIds.filter((i) => i !== id)
            : [...s.selectedOverlayIds, id]
          return {
            ...s,
            selectedOverlayId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
            selectedOverlayIds: newIds,
          }
        }
        return { ...s, selectedOverlayId: id, selectedOverlayIds: [id] }
      })
    },
    [setState]
  )

  const duplicateOverlay = useCallback(
    (id: string) => {
      const orig = stateRef.current.overlays.find((o) => o.id === id)
      if (!orig) return
      pushHistory()
      const dup: EditorOverlay = { ...orig, id: uuid(), x: orig.x + 2, y: orig.y + 2 }
      setState((s) => ({
        ...s,
        overlays: [...s.overlays, dup],
        selectedOverlayId: dup.id,
        selectedOverlayIds: [dup.id],
      }))
    },
    [pushHistory, setState]
  )

  const bringForward = useCallback(
    (id: string) => {
      pushHistory()
      setState((s) => ({
        ...s,
        overlays: s.overlays.map((o) => (o.id === id ? { ...o, zIndex: o.zIndex + 1 } : o)),
      }))
    },
    [pushHistory, setState]
  )

  const sendBackward = useCallback(
    (id: string) => {
      pushHistory()
      setState((s) => ({
        ...s,
        overlays: s.overlays.map((o) =>
          o.id === id ? { ...o, zIndex: Math.max(0, o.zIndex - 1) } : o
        ),
      }))
    },
    [pushHistory, setState]
  )

  // ── Audio Tracks ─────────────────────────────────────────────────────────

  const addAudioTrack = useCallback(
    (track: Omit<EditorAudioTrack, 'id'>) => {
      pushHistory()
      const id = uuid()
      setState((s) => ({
        ...s,
        audioTracks: [...s.audioTracks, { ...track, id }],
        selectedAudioId: id,
      }))
    },
    [pushHistory, setState]
  )

  const updateAudioTrack = useCallback(
    (id: string, partial: Partial<EditorAudioTrack>) => {
      setState((s) => ({
        ...s,
        audioTracks: s.audioTracks.map((a) => (a.id === id ? { ...a, ...partial } : a)),
      }))
    },
    [setState]
  )

  const removeAudioTrack = useCallback(
    (id: string) => {
      pushHistory()
      setState((s) => ({
        ...s,
        audioTracks: s.audioTracks.filter((a) => a.id !== id),
        selectedAudioId: s.selectedAudioId === id ? null : s.selectedAudioId,
      }))
    },
    [pushHistory, setState]
  )

  const selectAudio = useCallback(
    (id: string | null) => {
      setState((s) => ({ ...s, selectedAudioId: id, selectedOverlayId: id ? null : s.selectedOverlayId }))
    },
    [setState]
  )

  const setVolume = useCallback((n: number) => setState((s) => ({ ...s, volume: n })), [setState])
  const setSpeed = useCallback((n: number) => setState((s) => ({ ...s, speed: n })), [setState])
  const setZoomLevel = useCallback(
    (z: 1 | 2 | 4 | 8) => setState((s) => ({ ...s, zoomLevel: z })),
    [setState]
  )
  const setSnapToGrid = useCallback(
    (v: boolean) => setState((s) => ({ ...s, snapToGrid: v })),
    [setState]
  )
  const setShowGrid = useCallback(
    (v: boolean) => setState((s) => ({ ...s, showGrid: v })),
    [setState]
  )

  // ── Export ───────────────────────────────────────────────────────────────

  const exportVideo = useCallback(
    async (
      outputPath: string,
      format: 'mp4' | 'webm',
      opts?: {
        outputWidth?: number
        outputHeight?: number
        targetFps?: number
        crf?: number
        audioBitrate?: string
      }
    ) => {
      const s = stateRef.current
      if (!s.videoPath) return

      setState((prev) => ({ ...prev, isExporting: true, exportProgress: 0, exportLog: [] }))

      const [unlisten, unlistenLog] = await Promise.all([
        listenExportProgress((progress) => {
          setState((prev) => ({ ...prev, exportProgress: progress }))
        }),
        listenExportLog((line) => {
          setState((prev) => ({
            ...prev,
            exportLog: [...prev.exportLog.slice(-49), line],
          }))
        }),
      ])

      try {
        const instructions: ExportInstructions = {
          input_path: s.videoPath,
          output_path: outputPath,
          cuts: s.cuts.map((c) => ({ start_sec: c.startSec, end_sec: c.endSec })),
          overlays: s.overlays.map((o) => ({
            overlay_type: o.overlayType,
            x: Math.round((o.x / 100) * (s.videoInfo?.width ?? 1920)),
            y: Math.round((o.y / 100) * (s.videoInfo?.height ?? 1080)),
            content: o.content,
            start_t: o.startT,
            end_t: o.endT,
            font_size: o.fontSize,
            color: o.color.replace('#', ''),
          })),
          volume: s.volume,
          speed: s.speed,
          format,
          output_width: opts?.outputWidth,
          output_height: opts?.outputHeight,
          target_fps: opts?.targetFps,
          crf: opts?.crf,
          audio_bitrate: opts?.audioBitrate,
          audio_tracks: s.audioTracks.map(a => ({
            path: a.path,
            start_t: a.startT,
            offset_t: a.offsetT,
            duration: a.duration,
            volume: a.volume
          }))
        }

        await ffmpegCommands.exportWithEffects(instructions)
        setState((prev) => ({ ...prev, isExporting: false, exportProgress: 100 }))
      } catch (err) {
        setState((prev) => ({ ...prev, isExporting: false }))
        console.error('Export failed:', err)
      } finally {
        unlisten()
        unlistenLog()
      }
    },
    [setState]
  )

  return {
    state,
    loadVideo,
    play,
    pause,
    seek,
    addCut,
    removeCut,
    updateCut,
    addOverlay,
    updateOverlay,
    updateOverlayWithHistory,
    removeOverlay,
    removeSelectedOverlays,
    selectOverlay,
    duplicateOverlay,
    bringForward,
    sendBackward,
    addAudioTrack,
    updateAudioTrack,
    removeAudioTrack,
    selectAudio,
    setVolume,
    setSpeed,
    setZoomLevel,
    setSnapToGrid,
    setShowGrid,
    exportVideo,
    undo,
    redo,
    restoreFromSave,
    dismissRestore,
  }
}

export type EditorActions = Omit<ReturnType<typeof useEditor>, 'state'>
