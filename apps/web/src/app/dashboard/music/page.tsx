'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music, ChevronLeft, Sparkles, Play, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const MUSIC_GENRES = [
  'Neo-Soul', 'Jazz', 'Blues', 'Rock', 'Pop', 'Hip-Hop',
  'Electronic', 'Classical', 'Country', 'R&B', 'Reggae',
  'Folk', 'Metal', 'Indie', 'Ambient'
]

const KEY_SCALES = [
  'C major', 'C minor', 'D major', 'D minor', 'E major', 'E minor',
  'F major', 'F minor', 'G major', 'G minor', 'A major', 'A minor',
  'B major', 'B minor'
]

const TIME_SIGNATURES = ['4', '3', '6', '5', '7']
const LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt']

export default function MusicGenerationPage() {
  useAuth()
  const router = useRouter()

  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [duration, setDuration] = useState(120)
  const [bpm, setBpm] = useState(190)
  const [keyScale, setKeyScale] = useState('E minor')
  const [timeSignature, setTimeSignature] = useState('4')
  const [language, setLanguage] = useState('en')
  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999))
  const [steps, setSteps] = useState(8)
  const [cfg, setCfg] = useState(1)
  const [shift, setShift] = useState(3)
  const [cfgScale, setCfgScale] = useState(2)
  const [temperature, setTemperature] = useState(0.85)
  const [topP, setTopP] = useState(0.9)
  const [topK, setTopK] = useState(0)
  const [minP, setMinP] = useState(0)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (prompt.trim().length < 10 || lyrics.trim().length < 10) {
      setError('Please provide both prompt and lyrics (minimum 10 characters each)')
      return
    }

    setError(null)
    setIsGenerating(true)
    setProgress(10)
    setProgressMsg('Preparing music generation...')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const token = localStorage.getItem('token')

      const response = await fetch(`${apiUrl}/music/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          lyrics: lyrics.trim(),
          seed,
          steps,
          cfg,
          shift,
          duration,
          bpm,
          timeSignature,
          language,
          keyScale,
          cfgScale,
          temperature,
          topP,
          topK,
          minP,
        }),
      })

      if (!response.ok) throw new Error('Failed to start music generation')

      const data = await response.json()
      const jobId = data.jobId

      setProgress(30)
      setProgressMsg('Generating music with AI...')

      // Poll for completion
      let attempts = 0
      const maxAttempts = 60

      const pollStatus = async () => {
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          attempts++

          try {
            const statusResponse = await fetch(`${apiUrl}/music/status/${jobId}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            })

            if (!statusResponse.ok) continue

            const status = await statusResponse.json()

            if (status.status === 'DONE' && status.audioUrl) {
              setAudioUrl(status.audioUrl)
              setProgress(100)
              setProgressMsg('Your music is ready!')
              setIsGenerating(false)
              return
            } else if (status.status === 'FAILED') {
              throw new Error('Music generation failed')
            } else if (status.status === 'GENERATING') {
              setProgress(Math.min(30 + attempts * 1, 90))
              setProgressMsg('Processing audio...')
            }
          } catch (err) {
            console.warn('Polling error:', err)
          }
        }

        throw new Error('Music generation timed out')
      }

      await pollStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Music generation failed')
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1e1e2e] border border-white/10 p-8 md:p-12">
          <div className="absolute top-0 right-0 -m-8 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 -m-8 w-72 h-72 bg-cyan-500/10 blur-[120px] rounded-full" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
              <Music size={14} />
              AI Music Generation
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Create Your Music
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Describe your music style and provide lyrics. AI will generate a complete track with vocals.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Prompt */}
          <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Music Description</h3>
              <p className="text-xs text-zinc-500 mb-3">Describe the style, instruments, mood, and feel of your music</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Neo-Soul: A warm, organic neo-soul track dripping with live instrumentation and effortless groove. A live drummer plays a loose, hip-hop influenced pocket..."
                className="w-full h-32 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 resize-none"
              />
              <div className="text-xs text-zinc-600 mt-1">{prompt.length}/1000</div>
            </div>
          </div>

          {/* Lyrics */}
          <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Lyrics</h3>
              <p className="text-xs text-zinc-500 mb-3">Write your song lyrics with verse, chorus, bridge structure</p>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="[Verse 1]&#10;Late night glow on your skin&#10;Window cracked, city hums again&#10;&#10;[Chorus]&#10;Stay right there, don't pull it straight&#10;I love how we arrive late..."
                className="w-full h-64 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 resize-none font-mono text-sm"
              />
              <div className="text-xs text-zinc-600 mt-1">{lyrics.length}/5000</div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Music Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Duration (seconds)</label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">BPM (Tempo)</label>
                <input
                  type="number"
                  min={60}
                  max={240}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Key Scale</label>
                <select
                  value={keyScale}
                  onChange={(e) => setKeyScale(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                >
                  {KEY_SCALES.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Time Signature</label>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                >
                  {TIME_SIGNATURES.map(t => <option key={t} value={t}>{t}/4</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <details className="group">
              <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
                Advanced Settings
              </summary>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Steps</label>
                  <input type="number" min={1} max={50} value={steps} onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">CFG</label>
                  <input type="number" min={0} max={20} step={0.1} value={cfg} onChange={(e) => setCfg(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Shift</label>
                  <input type="number" min={0} max={10} step={0.1} value={shift} onChange={(e) => setShift(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">CFG Scale</label>
                  <input type="number" min={0} max={10} step={0.1} value={cfgScale} onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Temperature</label>
                  <input type="number" min={0} max={1} step={0.01} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Top P</label>
                  <input type="number" min={0} max={1} step={0.01} value={topP} onChange={(e) => setTopP(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Top K</label>
                  <input type="number" min={0} value={topK} onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Min P</label>
                  <input type="number" min={0} max={1} step={0.01} value={minP} onChange={(e) => setMinP(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-sm text-white" />
                </div>
              </div>
            </details>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || prompt.length < 10 || lyrics.length < 10}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-lg transition-all',
              isGenerating || prompt.length < 10 || lyrics.length < 10
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-[1.01] shadow-2xl shadow-purple-600/30'
            )}
          >
            <Sparkles size={22} />
            {isGenerating ? 'Generating Music...' : 'Generate Music'}
          </button>

          {/* Progress */}
          {isGenerating && (
            <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{progressMsg}</span>
                <span className="text-sm font-bold text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music size={20} className="text-green-400" />
                Your Music is Ready!
              </h3>
              <audio src={audioUrl} controls className="w-full" />
              <div className="flex gap-3">
                <a
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all"
                >
                  <Download size={16} />
                  Download Audio
                </a>
                <button
                  onClick={() => { setAudioUrl(null); setProgress(0); setIsGenerating(false) }}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
