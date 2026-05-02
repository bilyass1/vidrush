'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Upload, 
  Undo2, 
  Redo2, 
  Save, 
  ChevronLeft,
  Volume2,
  Zap,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { pickVideoFile } from '@/lib/tauri'
import { useEditor } from '@/hooks/useEditor'

import VideoPlayer from '@/components/editor/VideoPlayer'
import Timeline from '@/components/editor/Timeline'
import StickerPanel from '@/components/editor/StickerPanel'
import VideoOverlay from '@/components/editor/VideoOverlay'
import PropertiesPanel from '@/components/editor/PropertiesPanel'
import ExportModal from '@/components/editor/ExportModal'
import KeyboardShortcutsModal from '@/components/editor/KeyboardShortcutsModal'

export default function EditorPage() {
  const editor = useEditor()
  const { state, loadVideo, restoreFromSave, dismissRestore } = editor

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sourceBanner, setSourceBanner] = useState<string | null>(null)

  useEffect(() => {
    const source = sessionStorage.getItem('editor_source')
    if (source && !state.videoPath) {
      try {
        const parsed = JSON.parse(source)
        if (parsed.url) {
          loadVideo(parsed.url)
          setSourceBanner(parsed.title || 'Imported generated video')
        }
      } catch (e) {}
    }
  }, [state.videoPath, loadVideo])

  const handleSaveProject = useCallback(() => {
    if (!state.videoPath) return
    setIsSaving(true)
    try {
      const key = `vidrush_project_${state.videoPath.split(/[/\\]/).pop()}`
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), videoPath: state.videoPath }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {} finally { setIsSaving(false) }
  }, [state.videoPath])

  const handleImportClick = async () => {
    const path = await pickVideoFile()
    if (path) { loadVideo(path); setSourceBanner(null) }
  }

  const handleAddSticker = (type: 'image' | 'text', content: string, options?: any) => {
    editor.addOverlay({
      overlayType: type, content, x: 50, y: 50, width: 0, height: 0,
      startT: state.currentTime, endT: Math.min(state.currentTime + 5, state.duration),
      fontSize: options?.fontSize || 36, color: options?.color || '#ffffff',
      fontWeight: options?.fontWeight || 'normal', textAlign: options?.textAlign || 'center',
      background: 'none', zIndex: state.overlays.length
    })
  }

  const handleAddAudio = (track: { path: string, name: string, duration: number }) => {
    editor.addAudioTrack({
      ...track, startT: state.currentTime, offsetT: 0, volume: 1.0
    })
  }

  const handleUpdateOverlayTiming = useCallback((id: string, startT: number, endT: number) => {
    editor.updateOverlay(id, { startT, endT })
  }, [editor])

  const handleUpdateAudioTiming = useCallback((id: string, startT: number) => {
    editor.updateAudioTrack(id, { startT })
  }, [editor])

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      {state.pendingRestore && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 flex justify-between items-center text-sm z-[100] animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 font-medium"><Zap size={16} /> Session detected. Restore your work?</div>
          <div className="flex gap-2">
            <button onClick={restoreFromSave} className="bg-white text-red-600 px-3 py-1 rounded font-bold">Restore</button>
            <button onClick={dismissRestore} className="text-white bg-black/20 px-3 py-1 rounded">Ignore</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white"><ChevronLeft size={20} /></Link>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">VidRush Pro Editor</span>
            <span className="text-sm font-medium w-48 truncate">{state.videoPath?.split(/[/\\]/).pop() || 'No project loaded'}</span>
          </div>
          <div className="flex items-center gap-1 ml-4 overflow-hidden">
             <button onClick={handleImportClick} className="px-3 py-1.5 hover:bg-zinc-900 rounded text-xs flex items-center gap-2"><Upload size={14} /> Import</button>
             <button onClick={handleSaveProject} disabled={!state.videoPath || isSaving} className={`px-3 py-1.5 hover:bg-zinc-900 rounded text-xs flex items-center gap-2 ${saveSuccess ? 'text-green-500' : ''}`}>
               {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saveSuccess ? 'Saved' : 'Save'}
             </button>
             <div className="w-px h-4 bg-zinc-800 mx-2" />
             <button onClick={editor.undo} className="p-2 hover:bg-zinc-900 rounded text-zinc-500"><Undo2 size={14} /></button>
             <button onClick={editor.redo} className="p-2 hover:bg-zinc-900 rounded text-zinc-500"><Redo2 size={14} /></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-900 p-1.5 px-3 rounded-xl border border-zinc-800">
             <div className="flex items-center gap-1.5"><Zap size={14} className="text-orange-500" /><select value={state.speed} onChange={e => editor.setSpeed(Number(e.target.value))} className="bg-transparent text-xs text-zinc-300 outline-none"><option value={0.5}>0.5x</option><option value={1}>1.0x</option><option value={1.5}>1.5x</option><option value={2}>2.0x</option></select></div>
             <div className="w-px h-3 bg-zinc-700 mx-1" />
             <div className="flex items-center gap-2"><Volume2 size={14} className="text-zinc-500" /><input type="range" min="0" max="1" step="0.1" value={state.volume} onChange={e => editor.setVolume(Number(e.target.value))} className="w-16 accent-red-500 h-1" /></div>
          </div>
          <button onClick={() => setIsExportModalOpen(true)} disabled={!state.videoPath} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50">EXPORT</button>
        </div>
      </div>

      {!state.videoPath ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
           <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl animate-pulse"><Upload size={32} className="text-zinc-600" /></div>
           <h2 className="text-2xl font-bold mb-2">Welcome to your Creative Studio</h2>
           <p className="text-zinc-500 mb-8 max-w-sm text-center">Import a video file or pick a workspace to begin your masterpiece.</p>
           <button onClick={handleImportClick} className="px-10 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-xl shadow-red-900/20">Upload Video</button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
           <StickerPanel onAddSticker={handleAddSticker} onAddAudio={handleAddAudio} />

           <div className="flex-1 flex flex-col bg-[#050505] min-w-0 overflow-hidden">
              {/* Video preview — takes remaining space above timeline */}
              <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden p-6">
                 <div className="relative shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-zinc-800 rounded-sm overflow-hidden max-h-full">
                   <VideoPlayer videoPath={state.videoPath} currentTime={state.currentTime} isPlaying={state.isPlaying} volume={state.volume} speed={state.speed} onTimeUpdate={editor.seek} onPlay={editor.play} onPause={editor.pause} onSeek={editor.seek} onVolumeChange={editor.setVolume} onSpeedChange={editor.setSpeed} />
                   <VideoOverlay overlays={state.overlays} selectedId={state.selectedOverlayId} selectedIds={state.selectedOverlayIds} onSelect={editor.selectOverlay} onMove={(id, x, y) => editor.updateOverlay(id, { x, y })} onResize={(id, x, y, w, h) => editor.updateOverlay(id, { x, y, width: w, height: h })} currentTime={state.currentTime} snapToGrid={state.snapToGrid} showGrid={state.showGrid} containerWidth={1280} containerHeight={720} />
                 </div>
              </div>

              {/* Timeline — fixed height, never squeezed out */}
              <div className="shrink-0">
                <Timeline
                  duration={state.duration} currentTime={state.currentTime} thumbnails={state.thumbnails}
                  cuts={state.cuts} overlays={state.overlays} audioTracks={state.audioTracks}
                  selectedOverlayId={state.selectedOverlayId} selectedAudioId={state.selectedAudioId} zoomLevel={state.zoomLevel}
                  onSeek={editor.seek} onAddCut={editor.addCut} onRemoveCut={editor.removeCut} onUpdateCut={editor.updateCut}
                  onZoomChange={editor.setZoomLevel} onSelectOverlay={editor.selectOverlay}
                  onUpdateOverlayTiming={handleUpdateOverlayTiming} onSelectAudio={editor.selectAudio}
                  onUpdateAudioTiming={handleUpdateAudioTiming} onRemoveAudio={editor.removeAudioTrack}
                />
              </div>
           </div>

           <PropertiesPanel 
             selectedOverlay={state.overlays.find(o => o.id === state.selectedOverlayId)} 
             selectedAudio={state.audioTracks.find(a => a.id === state.selectedAudioId)}
             onUpdateOverlay={editor.updateOverlayWithHistory} onRemoveOverlay={editor.removeOverlay} onBringForward={editor.bringForward} onSendBackward={editor.sendBackward} 
             onUpdateAudio={editor.updateAudioTrack} onRemoveAudio={editor.removeAudioTrack} duration={state.duration} 
           />
        </div>
      )}

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={editor.exportVideo} isExporting={state.isExporting} exportProgress={state.exportProgress} exportLog={state.exportLog} videoDuration={state.duration} cutsCount={state.cuts.length} overlaysCount={state.overlays.length} speed={state.speed} volume={state.volume} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  )
}
