'use client'

import { Trash2, Layers, AlignLeft, AlignCenter, AlignRight, Bold, Music, Volume2, Type } from 'lucide-react'
import type { EditorOverlay, EditorAudioTrack } from '@/hooks/useEditor'

interface PropertiesPanelProps {
  selectedOverlay: EditorOverlay | undefined
  selectedAudio: EditorAudioTrack | undefined
  onUpdateOverlay: (id: string, partial: Partial<EditorOverlay>) => void
  onRemoveOverlay: (id: string) => void
  onBringForward: (id: string) => void
  onSendBackward: (id: string) => void
  onUpdateAudio: (id: string, partial: Partial<EditorAudioTrack>) => void
  onRemoveAudio: (id: string) => void
  duration: number
}

export default function PropertiesPanel({
  selectedOverlay,
  selectedAudio,
  onUpdateOverlay,
  onRemoveOverlay,
  onBringForward,
  onSendBackward,
  onUpdateAudio,
  onRemoveAudio,
  duration
}: PropertiesPanelProps) {
  if (!selectedOverlay && !selectedAudio) {
    return (
      <div className="absolute top-0 right-0 bottom-0 w-[250px] bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col items-center justify-center text-center">
        <Layers size={40} className="text-zinc-800 mb-4" />
        <p className="text-zinc-500 text-sm italic">Select an object or audio track to edit properties</p>
      </div>
    )
  }

  const renderOverlayProperties = (o: EditorOverlay) => (
    <>
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Appearance</h3>
        <button onClick={() => onRemoveOverlay(o.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"><Trash2 size={16} /></button>
      </div>
      <div className="p-4 space-y-6 overflow-y-auto">
        {o.overlayType === 'text' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Text Content</label>
              <textarea value={o.content} onChange={(e) => onUpdateOverlay(o.id, { content: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500/50 h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-zinc-500 uppercase">Size</label>
                 <input type="number" value={o.fontSize} onChange={(e) => onUpdateOverlay(o.id, { fontSize: parseInt(e.target.value) || 12 })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white" />
               </div>
               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-zinc-500 uppercase">Style</label>
                 <button onClick={() => onUpdateOverlay(o.id, { fontWeight: o.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`w-full flex items-center justify-center gap-2 py-1.5 rounded border ${o.fontWeight === 'bold' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}><Bold size={14} /></button>
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Alignment</label>
              <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                <button onClick={() => onUpdateOverlay(o.id, { textAlign: 'left' })} className={`flex-1 flex justify-center py-1 rounded ${o.textAlign === 'left' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}><AlignLeft size={14} /></button>
                <button onClick={() => onUpdateOverlay(o.id, { textAlign: 'center' })} className={`flex-1 flex justify-center py-1 rounded ${o.textAlign === 'center' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}><AlignCenter size={14} /></button>
                <button onClick={() => onUpdateOverlay(o.id, { textAlign: 'right' })} className={`flex-1 flex justify-center py-1 rounded ${o.textAlign === 'right' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}><AlignRight size={14} /></button>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-800">
               <label className="text-[11px] font-bold text-zinc-500 uppercase">Effects</label>
               <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer"><input type="checkbox" checked={o.shadow} onChange={(e) => onUpdateOverlay(o.id, { shadow: e.target.checked })} className="accent-red-500" /> Drop Shadow</label>
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer"><input type="checkbox" checked={o.outline} onChange={(e) => onUpdateOverlay(o.id, { outline: e.target.checked })} className="accent-red-500" /> Outline</label>
               </div>
            </div>
          </div>
        )}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
           <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Arrangement</label>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onBringForward(o.id)} className="py-2 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-white">Bring Forward</button>
              <button onClick={() => onSendBackward(o.id)} className="py-2 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-white">Send Backward</button>
           </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Timing (secs)</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-600">Start</label>
              <input type="number" step="0.1" value={o.startT.toFixed(1)} onChange={(e) => onUpdateOverlay(o.id, { startT: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-600">End</label>
              <input type="number" step="0.1" value={o.endT.toFixed(1)} onChange={(e) => onUpdateOverlay(o.id, { endT: parseFloat(e.target.value) || duration })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white" />
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const renderAudioProperties = (a: EditorAudioTrack) => (
    <>
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
           <Music size={16} className="text-red-500" />
           <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Audio Track</h3>
        </div>
        <button onClick={() => onRemoveAudio(a.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"><Trash2 size={16} /></button>
      </div>
      <div className="p-4 space-y-6">
        <div className="space-y-1 text-center">
           <span className="text-xs text-white block truncate font-medium">{a.name}</span>
           <span className="text-[10px] text-zinc-500 block">Source: Local File</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-[11px] font-bold text-zinc-500 uppercase">Volume</label>
             <span className="text-[11px] text-zinc-400">{Math.round(a.volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
             <Volume2 size={14} className="text-zinc-600" />
             <input type="range" min="0" max="2" step="0.01" value={a.volume} onChange={(e) => onUpdateAudio(a.id, { volume: parseFloat(e.target.value) })} className="flex-1 accent-red-500 h-1.5" />
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-zinc-800">
           <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Timing (secs)</label>
           <div className="space-y-3">
              <div className="space-y-1">
                 <label className="text-[10px] text-zinc-600">Start on Timeline</label>
                 <input type="number" step="0.1" value={a.startT.toFixed(1)} onChange={(e) => onUpdateAudio(a.id, { startT: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] text-zinc-600">Internal Offset (Crop)</label>
                 <input type="number" step="0.1" value={a.offsetT.toFixed(1)} onChange={(e) => onUpdateAudio(a.id, { offsetT: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] text-zinc-600">Duration</label>
                 <input type="number" step="0.1" value={a.duration.toFixed(1)} onChange={(e) => onUpdateAudio(a.id, { duration: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white" />
              </div>
           </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[250px] bg-zinc-950 border-l border-zinc-800 flex flex-col">
      {selectedOverlay ? renderOverlayProperties(selectedOverlay) : renderAudioProperties(selectedAudio!)}
    </div>
  )
}
