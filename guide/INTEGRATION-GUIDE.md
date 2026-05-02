# VidRush Video Editor - Integration Guide
## Complete setup for Tauri 2 + React

---

## 1. PROJECT SETUP

### Create Tauri 2 Project
```bash
npm create tauri-app@latest vidRush -- \
  --builder vite \
  --ui react \
  --typescript
cd vidRush
```

### Install Dependencies
```bash
npm install zustand classnames
npm install -D tailwindcss postcss autoprefixer
```

---

## 2. BACKEND SETUP (Rust)

### Copy Commands to Tauri
```bash
# Copy tauri-commands.rs content to:
cp tauri-commands.rs src-tauri/src/commands.rs
```

### Update `src-tauri/src/main.rs`
```rust
#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      // Video Operations
      commands::upscale_video,
      commands::convert_fps,
      commands::trim_video,
      
      // Effects
      commands::apply_grayscale,
      commands::apply_blur,
      commands::apply_brightness,
      commands::apply_saturation,
      commands::apply_fade_in,
      
      // Speed & Export
      commands::change_speed,
      commands::export_video,
      commands::get_video_info,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### Update `src-tauri/Cargo.toml`
```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = ["shell-open"] }
tauri-build = { version = "2" }
```

---

## 3. FRONTEND SETUP (React)

### Create Component Structure
```bash
mkdir -p src/components/Editor
mkdir -p src/components/Sidebar
mkdir -p src/components/Toolbar
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/styles
```

### Copy React Component
```bash
# Copy Editor.tsx to:
cp Editor.tsx src/components/Editor/Editor.tsx
cp Editor.css src/styles/editor.css
```

### Create State Management Hook
```bash
# Create src/hooks/useEditor.ts
```

### Update `src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/editor.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Update `src/App.tsx`
```tsx
import Editor from './components/Editor/Editor'

function App() {
  return <Editor />
}

export default App
```

---

## 4. DEPENDENCY: FFmpeg

### Windows
```bash
# Download ffmpeg.exe from https://ffmpeg.org/download.html
# Place in: src-tauri/resources/ffmpeg.exe

# Or use choco (if installed)
choco install ffmpeg
```

### macOS
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install ffmpeg
```

### Bundle with App (Tauri Config)
Update `src-tauri/tauri.conf.json`:
```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "VidRush Video Editor",
        "width": 1600,
        "height": 900,
        "minWidth": 1200,
        "minHeight": 700
      }
    ]
  },
  "build": {
    "beforeBuildCommand": "",
    "beforeDevCommand": "",
    "devPath": "http://localhost:5173",
    "frontendDist": "../dist"
  }
}
```

---

## 5. CREATE EDITOR STATE HOOK

### `src/hooks/useEditor.ts`
```typescript
import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

interface EditorContextType {
  tracks: Track[]
  selectedClipId: string | null
  currentTime: number
  isPlaying: boolean
  zoom: number
  
  addClip: (file: File) => Promise<void>
  removeClip: (id: string) => void
  updateClip: (id: string, props: Partial<Clip>) => void
  applyEffect: (clipId: string, effectName: string) => Promise<void>
  exportVideo: (outputPath: string, quality: string) => Promise<void>
}

export function useEditor(): EditorContextType {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track-1', type: 'video', clips: [] }
  ])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)

  const addClip = useCallback(async (file: File) => {
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      path: file.path || '',
      name: file.name,
      duration: 0,
      startTime: 0,
      effects: [],
      speed: 1,
    }

    setTracks(prev => prev.map(t =>
      t.type === 'video' ? { ...t, clips: [...t.clips, newClip] } : t
    ))
  }, [])

  const removeClip = useCallback((id: string) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== id)
    })))
  }, [])

  const updateClip = useCallback((id: string, props: Partial<Clip>) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === id ? { ...c, ...props } : c)
    })))
  }, [])

  const applyEffect = useCallback(async (clipId: string, effectName: string) => {
    const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId)
    if (!clip) return

    try {
      const result = await invoke(effectName, {
        input: clip.path,
        output: clip.path.replace('.mp4', `_${effectName}.mp4`)
      })

      updateClip(clipId, {
        effects: [...clip.effects, effectName]
      })
    } catch (error) {
      console.error('Effect failed:', error)
    }
  }, [tracks, updateClip])

  const exportVideo = useCallback(async (outputPath: string, quality: string) => {
    try {
      const firstClip = tracks.flatMap(t => t.clips)[0]
      if (!firstClip) throw new Error('No clips to export')

      await invoke('export_video', {
        input: firstClip.path,
        output: outputPath,
        quality
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [tracks])

  return {
    tracks,
    selectedClipId,
    currentTime,
    isPlaying,
    zoom,
    addClip,
    removeClip,
    updateClip,
    applyEffect,
    exportVideo,
  }
}
```

---

## 6. BUILD & RUN

### Development
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

---

## 7. FILE STRUCTURE (Final)

```
vidRush/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   └── Editor.tsx
│   │   ├── Sidebar/
│   │   └── Toolbar/
│   ├── hooks/
│   │   └── useEditor.ts
│   ├── types/
│   │   └── editor.ts
│   ├── styles/
│   │   └── editor.css
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── commands.rs      # ← Paste tauri-commands.rs here
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

---

## 8. TROUBLESHOOTING

### FFmpeg Not Found
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not, install it (see dependency section)
```

### Tauri Build Fails
```bash
# Clear build cache
rm -rf src-tauri/target
npm run tauri build
```

### Hot Reload Not Working
```bash
# Kill all Node processes
killall node

# Restart dev server
npm run tauri dev
```

---

## 9. NEXT FEATURES TO ADD

- [ ] Real-time preview with Web Workers
- [ ] Audio waveform visualization
- [ ] Keyframe animation system
- [ ] Multi-track timeline
- [ ] Batch processing
- [ ] Project save/load (JSON)
- [ ] Undo/redo system
- [ ] Custom presets
- [ ] GPU acceleration

---

## 10. PERFORMANCE TIPS

1. **Lazy load effects** - Only render visible clips
2. **Cache video metadata** - Don't re-read file info
3. **Use Web Workers** - Offload heavy processing
4. **Debounce timeline scrubber** - Reduce preview updates
5. **Implement virtual scrolling** - For many clips

---

Done! You now have a professional video editor ready to use. 🎬
