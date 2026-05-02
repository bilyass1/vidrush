import { useState } from 'react'
import { Type, Smile, Square, Music, Plus } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'

interface StickerPanelProps {
  onAddSticker: (overlayType: 'image' | 'text', content: string, options?: any) => void
  onAddAudio: (track: { path: string, name: string, duration: number }) => void
}

const EMOJIS = ['🔥', '⭐', '💯', '❤️', '👍', '😂', '🎉', '🚀', '💪', '👀', '🎬', '🎵', '📱', '💰', '🌟', '✨', '🏆', '💎', '🔑', '📢']
const SHAPES = ['circle', 'square', 'triangle', 'arrow', 'star', 'heart', 'diamond', 'badge', 'burst', 'ribbon', 'banner', 'cloud', 'hexagon', 'pentagon', 'cross']
const DECORATIONS = ['confetti', 'sparkles', 'fireworks', 'crown', 'lightning', 'rainbow', 'flower', 'wave', 'dotted-border', 'neon-frame', 'glitch', 'retro-badge', 'sale-tag', 'new-badge', 'hot-badge']

const TEXT_PRESETS = [
  { id: 'title', label: 'TITLE', fontSize: 48, color: '#ffffff', fontWeight: 'bold' },
  { id: 'subtitle', label: 'SUBTITLE', fontSize: 32, color: '#d4d4d8', fontWeight: 'normal' },
  { id: 'lower_third', label: 'LOWER THIRD', fontSize: 24, color: '#ffffff', fontWeight: 'normal' },
  { id: 'caption', label: 'CAPTION', fontSize: 18, color: '#ffffff', fontWeight: 'normal' },
  { id: 'cta', label: 'CALL TO ACTION', fontSize: 42, color: '#ef4444', fontWeight: 'bold' },
]

export default function StickerPanel({ onAddSticker, onAddAudio }: StickerPanelProps) {
  const [tab, setTab] = useState<'text' | 'emojis' | 'shapes' | 'decorations' | 'audio'>('text')
  const [customText, setCustomText] = useState('')
  const [fontSize, setFontSize] = useState(32)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center')

  const handleAddPreset = (p: typeof TEXT_PRESETS[0]) => {
    onAddSticker('text', p.label, {
      fontSize: p.fontSize,
      color: p.color,
      fontWeight: p.fontWeight,
    })
  }

  const handleAddCustomText = () => {
    if (!customText.trim()) return
    onAddSticker('text', customText, {
      fontSize,
      color: textColor,
      textAlign,
    })
    setCustomText('')
  }

  return (
    <div className="w-[240px] flex flex-col bg-zinc-950 border-r border-zinc-800 text-sm h-full">
      <div className="flex bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button onClick={() => setTab('text')} className={`flex-1 flex flex-col items-center py-2 transition-colors ${tab === 'text' ? 'text-red-500 bg-zinc-950/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Type size={18} />
          <span className="text-[10px] mt-1">Text</span>
        </button>
        <button onClick={() => setTab('emojis')} className={`flex-1 flex flex-col items-center py-2 transition-colors ${tab === 'emojis' ? 'text-red-500 bg-zinc-950/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Smile size={18} />
          <span className="text-[10px] mt-1">Emojis</span>
        </button>
        <button onClick={() => setTab('shapes')} className={`flex-1 flex flex-col items-center py-2 transition-colors ${tab === 'shapes' ? 'text-red-500 bg-zinc-950/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Square size={18} />
          <span className="text-[10px] mt-1">Shapes</span>
        </button>
        <button onClick={() => setTab('decorations')} className={`flex-1 flex flex-col items-center py-2 transition-colors ${tab === 'decorations' ? 'text-red-500 bg-zinc-950/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Square size={18} />
          <span className="text-[10px] mt-1">Stickers</span>
        </button>
        <button onClick={() => setTab('audio')} className={`flex-1 flex flex-col items-center py-2 transition-colors ${tab === 'audio' ? 'text-red-500 bg-zinc-950/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Music size={18} />
          <span className="text-[10px] mt-1">Audio</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {tab === 'audio' && (
          <div className="space-y-4">
             <button 
               onClick={async () => {
                 const selected = await openDialog({
                   multiple: false,
                   filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] }]
                 })
                 if (typeof selected === 'string') {
                   // In a real app we'd get duration here, for now assume 30s or use a helper
                   onAddAudio({ path: selected, name: selected.split(/[/\\]/).pop() || 'Audio', duration: 30 })
                 }
               }}
               className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-red-500 py-4 rounded-xl text-zinc-400 hover:text-white transition-all group"
             >
               <Music size={24} className="group-hover:scale-110 transition-transform" />
               <div className="flex flex-col items-start">
                 <span className="text-sm font-bold">Import Audio</span>
                 <span className="text-[10px] opacity-50">MP3, WAV, AAC...</span>
               </div>
             </button>

             <div className="pt-4 space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Library</h4>
                <div className="grid grid-cols-1 gap-2">
                   {['Lofi Beat', 'Dramatic Cello', 'Happy Ukulele', 'Neon Night'].map(m => (
                     <button key={m} className="w-full text-left p-2 bg-zinc-900 border border-zinc-800 rounded group hover:border-zinc-700">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 group-hover:text-red-500">
                              <Music size={14} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs text-white">{m}</span>
                              <span className="text-[10px] text-zinc-500">2:45 • Royalty Free</span>
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}
        {tab === 'text' && (
          <div className="space-y-6">
            <div className="space-y-2">
               <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Presets</h4>
               <div className="space-y-2">
                 {TEXT_PRESETS.map(p => (
                   <button 
                     key={p.id} 
                     onClick={() => handleAddPreset(p)}
                     className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-2.5 rounded text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                     style={{ fontSize: Math.min(p.fontSize / 2.5, 14), color: p.color }}
                   >
                     {p.label}
                   </button>
                 ))}
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
               <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Custom Builder</h4>
               <input
                 type="text"
                 placeholder="Enter text..."
                 value={customText}
                 onChange={(e) => setCustomText(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
               />
               
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <label className="text-[10px] text-zinc-500">Size</label>
                   <select 
                     value={fontSize} 
                     onChange={(e) => setFontSize(Number(e.target.value))}
                     className="w-full bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white"
                   >
                     {[12, 18, 24, 32, 48, 64, 96].map(s => <option key={s} value={s}>{s}px</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] text-zinc-500">Color</label>
                   <div className="flex gap-1.5 flex-wrap">
                     {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                       <button
                         key={c}
                         onClick={() => setTextColor(c)}
                         className={`w-4 h-4 rounded-full border border-white/20 ${textColor === c ? 'ring-2 ring-white' : ''}`}
                         style={{ backgroundColor: c }}
                       />
                     ))}
                   </div>
                 </div>
               </div>

               <button
                 onClick={handleAddCustomText}
                 disabled={!customText.trim()}
                 className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded transition-colors"
               >
                 <Plus size={14} /> Add Text
               </button>
            </div>
          </div>
        )}

        {tab === 'emojis' && (
          <div className="grid grid-cols-4 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onAddSticker('text', emoji, { fontSize: 48 })}
                className="text-2xl hover:bg-zinc-900 p-1 rounded transition-colors hover:scale-125"
                title="Add Emoji"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {(tab === 'shapes' || tab === 'decorations') && (
          <div className="grid grid-cols-2 gap-2">
            {(tab === 'shapes' ? SHAPES : DECORATIONS).map((name) => (
              <button
                key={name}
                onClick={() => onAddSticker('image', `/stickers/${name}.svg`)}
                className="aspect-square bg-zinc-900 border border-zinc-800 hover:border-red-500 flex items-center justify-center rounded overflow-hidden p-2 group transition-all"
                title={name}
              >
                <img src={`/stickers/${name}.svg`} alt={name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] text-zinc-500">${name}</span>` }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
