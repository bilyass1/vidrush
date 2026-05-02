'use client'

import { X, Command } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { section: 'Playback', items: [
    { key: 'Space', desc: 'Play / Pause' },
    { key: '← / →', desc: 'Seek ±1 second' },
    { key: 'Shift + ← / →', desc: 'Seek ±10 seconds' },
  ]},
  { section: 'Editing', items: [
    { key: '[', desc: 'Set cut start' },
    { key: ']', desc: 'Set cut end' },
    { key: 'Delete', desc: 'Remove selection' },
    { key: 'Ctrl + D', desc: 'Duplicate overlay' },
    { key: 'Ctrl + Z', desc: 'Undo' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo' },
    { key: 'Escape', desc: 'Deselect' },
  ]},
  { section: 'View', items: [
    { key: '+ / -', desc: 'Zoom timeline' },
    { key: 'F', desc: 'Fit to window' },
    { key: '?', desc: 'Show this dialog' },
  ]}
]

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-[450px] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Command size={18} className="text-red-500" /> Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{section.section}</h3>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{item.desc}</span>
                    <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 font-mono min-w-[30px] text-center shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex justify-center">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-all"
            >
              Got it
            </button>
        </div>
      </div>
    </div>
  )
}
