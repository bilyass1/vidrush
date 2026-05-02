'use client'

import { useState } from 'react'
import {
  Pin,
  Clapperboard,
  Palette,
  Camera,
  Clock,
  Anchor,
  Repeat,
  Hash,
  ImageIcon,
  Save,
  RefreshCw,
  Pencil,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationResult } from '@/lib/api'

export type { GenerationResult }

interface ResultPanelProps {
  result: GenerationResult
  onRegenerate: () => void
  onSaveDraft: (result: GenerationResult) => void
  onGenerateVideo?: () => void
}

export default function ResultPanel({ result, onRegenerate, onSaveDraft, onGenerateVideo }: ResultPanelProps) {
  const [data, setData] = useState<GenerationResult>(result)
  const [editing, setEditing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    script: true,
    visual: true,
    camera: false,
    timeline: false,
  })

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const updateField = <K extends keyof GenerationResult>(key: K, value: GenerationResult[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateSceneContent = (idx: number, content: string) => {
    setData((prev) => ({
      ...prev,
      script: prev.script.map((s, i) => (i === idx ? { ...s, content } : s)),
    }))
  }

  const updateCameraMovement = (idx: number, movement: string) => {
    setData((prev) => ({
      ...prev,
      cameraMovements: prev.cameraMovements.map((c, i) => (i === idx ? { ...c, movement } : c)),
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            Generation Complete
          </p>
          <h2 className="text-2xl font-black text-white">Your Video Concept</h2>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
            editing
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          )}
        >
          <Pencil size={14} />
          {editing ? 'Editing' : 'Edit Mode'}
        </button>
      </div>

      {/* Title */}
      <Section icon={<Pin size={18} />} label="Title">
        {editing ? (
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-purple-500 transition-colors"
          />
        ) : (
          <p className="text-white text-lg font-bold">{data.title}</p>
        )}
      </Section>

      {/* Script / Story */}
      <CollapsibleSection
        icon={<Clapperboard size={18} />}
        label="Script / Story"
        expanded={expandedSections.script}
        onToggle={() => toggleSection('script')}
      >
        <div className="space-y-4">
          {data.script.map((scene, idx) => (
            <div
              key={idx}
              className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Scene {scene.scene}
                </span>
                <span className="text-xs text-zinc-500">{scene.duration}</span>
              </div>
              {editing ? (
                <textarea
                  value={scene.content}
                  onChange={(e) => updateSceneContent(idx, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[80px]"
                />
              ) : (
                <p className="text-zinc-300 text-sm leading-relaxed">{scene.content}</p>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Visual Style */}
      <CollapsibleSection
        icon={<Palette size={18} />}
        label="Visual Style"
        expanded={expandedSections.visual}
        onToggle={() => toggleSection('visual')}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {data.visualStyle.colors.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg border border-zinc-700 shadow-lg"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          {editing ? (
            <textarea
              value={data.visualStyle.description}
              onChange={(e) =>
                updateField('visualStyle', { ...data.visualStyle, description: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[60px]"
            />
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed">
              {data.visualStyle.description}
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Camera Movements */}
      <CollapsibleSection
        icon={<Camera size={18} />}
        label="Camera Movements"
        expanded={expandedSections.camera}
        onToggle={() => toggleSection('camera')}
      >
        <div className="space-y-2">
          {data.cameraMovements.map((cam, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xs text-purple-400 font-bold mt-1 shrink-0">
                Scene {cam.scene}
              </span>
              {editing ? (
                <input
                  type="text"
                  value={cam.movement}
                  onChange={(e) => updateCameraMovement(idx, e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              ) : (
                <p className="text-zinc-300 text-sm">{cam.movement}</p>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Timeline */}
      <CollapsibleSection
        icon={<Clock size={18} />}
        label="Timeline"
        expanded={expandedSections.timeline}
        onToggle={() => toggleSection('timeline')}
      >
        <div className="relative">
          {/* Visual timeline bar */}
          <div className="w-full h-10 bg-zinc-950 rounded-xl border border-zinc-800 flex overflow-hidden">
            {data.timeline.map((seg, idx) => (
              <div
                key={idx}
                className="h-full flex items-center justify-center text-[10px] font-bold text-white border-r border-zinc-800 last:border-r-0 hover:brightness-125 transition-all cursor-default"
                style={{
                  flex: 1,
                  backgroundColor: COLORS_TIMELINE[idx % COLORS_TIMELINE.length],
                }}
                title={`${seg.start} - ${seg.end}`}
              >
                S{seg.scene}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {data.timeline.map((seg, idx) => (
              <div key={idx} className="text-[10px] text-zinc-500 text-center flex-1">
                {seg.start} — {seg.end}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Hook (if present) */}
      {data.hook && (
        <Section icon={<Anchor size={18} />} label="Hook">
          {editing ? (
            <textarea
              value={data.hook}
              onChange={(e) => updateField('hook', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[60px]"
            />
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed">{data.hook}</p>
          )}
        </Section>
      )}

      {/* Loop (if present) */}
      {data.loop && (
        <Section icon={<Repeat size={18} />} label="Loop">
          {editing ? (
            <textarea
              value={data.loop}
              onChange={(e) => updateField('loop', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[60px]"
            />
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed">{data.loop}</p>
          )}
        </Section>
      )}

      {/* Tags */}
      <Section icon={<Hash size={18} />} label="Suggested Tags & Hashtags">
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </Section>

      {/* Thumbnail Concept */}
      <Section icon={<ImageIcon size={18} />} label="Suggested Thumbnail Concept">
        {editing ? (
          <textarea
            value={data.thumbnailConcept}
            onChange={(e) => updateField('thumbnailConcept', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[60px]"
          />
        ) : (
          <p className="text-zinc-300 text-sm leading-relaxed">{data.thumbnailConcept}</p>
        )}
      </Section>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
        <button
          onClick={() => onSaveDraft(data)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
        >
          <Save size={16} />
          Save Draft
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
        >
          <RefreshCw size={16} />
          Regenerate
        </button>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
        >
          <Pencil size={16} />
          Edit Further
        </button>
        <button
          onClick={onGenerateVideo}
          disabled={!onGenerateVideo}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-green-600/20 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
        >
          <Share2 size={16} />
          Generate Video
        </button>
      </div>
    </div>
  )
}

const COLORS_TIMELINE = [
  '#8338EC80',
  '#3A86FF80',
  '#06FFA580',
  '#FF006E80',
  '#FFBE0B80',
  '#FB560780',
]

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-purple-400">{icon}</div>
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{label}</h3>
      </div>
      {children}
    </div>
  )
}

function CollapsibleSection({
  icon,
  label,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode
  label: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-purple-400">{icon}</div>
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{label}</h3>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-zinc-500" />
        ) : (
          <ChevronDown size={16} className="text-zinc-500" />
        )}
      </button>
      {expanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}
