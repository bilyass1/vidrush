'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, AlertCircle, Play, Square, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

interface Voice {
  voice_id: string
  name: string
  preview_url?: string
  gender?: string
  language?: string
  accent?: string
  age?: string
}

interface VoiceTestPanelProps {
  onVoiceSelected?: (voiceId: string, voiceName: string) => void
  isLoading?: boolean
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function getAvatarColor(id: string) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-green-600',
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function VoiceTestPanel({ onVoiceSelected, isLoading = false }: VoiceTestPanelProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [testText, setTestText] = useState('Hello, welcome to VidRush')
  const [testAudio, setTestAudio] = useState<string | null>(null)
  const [isLoadingVoices, setIsLoadingVoices] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch(`${API_URL}/video/voices/available`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch voices')
        const data = await res.json()
        setVoices(data)
        if (data.length > 0) setSelectedVoice(data[0])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voices')
      } finally {
        setIsLoadingVoices(false)
      }
    }
    fetchVoices()
  }, [])

  const languages = ['all', ...Array.from(new Set(voices.map((v) => v.language).filter(Boolean)))] as string[]

  const filtered = voices.filter((v) => {
    const genderMatch = genderFilter === 'all' || v.gender?.toLowerCase() === genderFilter
    const langMatch = languageFilter === 'all' || v.language?.toLowerCase() === languageFilter.toLowerCase()
    return genderMatch && langMatch
  })

  const handleTestVoice = async () => {
    if (!selectedVoice) return
    setIsTesting(true)
    setError(null)
    setTestAudio(null)
    try {
      const res = await fetch(`${API_URL}/video/voices/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: testText, voiceId: selectedVoice.voice_id, modelId: 'eleven_turbo_v2_5' }),
      })
      if (!res.ok) throw new Error('Voice test failed')
      const data = await res.json()
      setTestAudio(data.audioBase64)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test voice')
    } finally {
      setIsTesting(false)
    }
  }

  const handlePlayAudio = () => {
    if (!testAudio) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(false); return }
    const audio = new Audio(`data:audio/mp3;base64,${testAudio}`)
    audioRef.current = audio
    audio.onplay = () => setPlaying(true)
    audio.onended = () => { setPlaying(false); audioRef.current = null }
    audio.play()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-lg">
          🎤
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Voice Models</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Pick and preview a voice before generating</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {isLoadingVoices ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={14} className="text-zinc-500" />
            {/* Gender filter */}
            <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              {['all', 'male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all capitalize',
                    genderFilter === g ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {g === 'all' ? 'All' : g === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
            {/* Language filter */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-green-600/50 capitalize"
            >
              {languages.map((l) => (
                <option key={l} value={l} className="capitalize">
                  {l === 'all' ? 'All Languages' : l}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-600 ml-auto">{filtered.length} voices</span>
          </div>

          {/* Voice Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filtered.map((voice) => (
              <button
                key={voice.voice_id}
                type="button"
                onClick={() => { setSelectedVoice(voice); setTestAudio(null) }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all',
                  selectedVoice?.voice_id === voice.voice_id
                    ? 'bg-green-600/10 border-green-500 shadow-lg shadow-green-500/10'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0',
                  getAvatarColor(voice.voice_id)
                )}>
                  {getInitials(voice.name)}
                </div>
                <span className={cn(
                  'text-xs font-semibold truncate w-full',
                  selectedVoice?.voice_id === voice.voice_id ? 'text-green-300' : 'text-zinc-200'
                )}>
                  {voice.name}
                </span>
                <div className="flex flex-wrap gap-1 justify-center">
                  {voice.gender && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                      {voice.gender === 'male' ? '♂' : voice.gender === 'female' ? '♀' : ''} {voice.gender}
                    </span>
                  )}
                  {voice.language && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                      {voice.language}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-8 text-zinc-600 text-sm">No voices match filters</div>
            )}
          </div>

          {/* Selected voice info */}
          {selectedVoice && (
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className={cn(
                'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0',
                getAvatarColor(selectedVoice.voice_id)
              )}>
                {getInitials(selectedVoice.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{selectedVoice.name}</p>
                <p className="text-xs text-zinc-500 capitalize">
                  {[selectedVoice.gender, selectedVoice.language, selectedVoice.accent].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-xs text-green-400 font-medium">Selected</span>
            </div>
          )}

          {/* Test Text */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white">Test Text</label>
            <textarea
              value={testText}
              onChange={(e) => { if (e.target.value.length <= 500) setTestText(e.target.value) }}
              placeholder="Enter text to preview..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-600/50 transition-all resize-none text-sm"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>3–5 words for a quick preview</span>
              <span>{testText.length}/500</span>
            </div>
          </div>

          {/* Test + Play */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={!selectedVoice || isTesting || testText.length === 0}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                !selectedVoice || isTesting || testText.length === 0
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
              )}
            >
              {isTesting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Testing...</>
              ) : (
                <><Sparkles size={15} /> Preview</>
              )}
            </button>

            {testAudio && (
              <button
                type="button"
                onClick={handlePlayAudio}
                className={cn(
                  'flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all',
                  playing ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                )}
              >
                {playing ? <><Square size={14} /> Stop</> : <><Play size={14} /> Play</>}
              </button>
            )}
          </div>

          {/* Use Voice */}
          <button
            type="button"
            onClick={() => selectedVoice && onVoiceSelected?.(selectedVoice.voice_id, selectedVoice.name)}
            disabled={!selectedVoice || isLoading}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-sm transition-all',
              !selectedVoice || isLoading
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-600/20'
            )}
          >
            {isLoading ? 'Loading...' : `Use "${selectedVoice?.name || 'selected'}" Voice`}
          </button>
        </div>
      )}
    </div>
  )
}
