import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './Editor.css';

interface Clip {
  id: string;
  path: string;
  name: string;
  duration: number;
  startTime: number;
  effects: string[];
  speed: number;
}

interface Track {
  id: string;
  type: 'video' | 'audio';
  clips: Clip[];
}

interface EditorState {
  tracks: Track[];
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
}

export default function Editor() {
  const [state, setState] = useState<EditorState>({
    tracks: [{ id: 'track-1', type: 'video', clips: [] }],
    selectedClipId: null,
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
  });

  const [sidebarTab, setSidebarTab] = useState<'media' | 'effects' | 'transitions' | 'audio'>('media');
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Get selected clip
  const selectedClip = state.tracks
    .flatMap(t => t.clips)
    .find(c => c.id === state.selectedClipId);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      path: file.path || '',
      name: file.name,
      duration: 0,
      startTime: 0,
      effects: [],
      speed: 1,
    };

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.type === 'video' ? { ...t, clips: [...t.clips, newClip] } : t
      ),
    }));
  };

  // Apply upscale effect
  const handleUpscale = async () => {
    if (!selectedClip) return;

    try {
      const result = await invoke('upscale_video', {
        input: selectedClip.path,
        output: selectedClip.path.replace('.mp4', '_1080p.mp4'),
      });
      console.log('Upscaled:', result);
      setActiveEffect('upscale');
    } catch (error) {
      console.error('Upscale failed:', error);
    }
  };

  // Convert FPS
  const handleConvertFPS = async (fps: number) => {
    if (!selectedClip) return;

    try {
      const result = await invoke('convert_fps', {
        input: selectedClip.path,
        output: selectedClip.path.replace('.mp4', `_${fps}fps.mp4`),
        fps,
      });
      console.log('FPS converted:', result);
      setActiveEffect('fps');
    } catch (error) {
      console.error('FPS conversion failed:', error);
    }
  };

  // Apply effect (grayscale, blur, etc.)
  const handleApplyEffect = async (effectName: string) => {
    if (!selectedClip) return;

    try {
      await invoke('apply_effect', {
        input: selectedClip.path,
        output: selectedClip.path.replace('.mp4', `_${effectName}.mp4`),
        effect: effectName,
        params: {},
      });
      setActiveEffect(effectName);
    } catch (error) {
      console.error('Effect failed:', error);
    }
  };

  return (
    <div className="editor">
      {/* Top Menu */}
      <header className="editor-header">
        <div className="header-left">
          <h1>VidRush</h1>
          <span className="project-name">Untitled Project</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary">Export</button>
          <button className="btn-secondary">Save</button>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="editor-main">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`tab ${sidebarTab === 'media' ? 'active' : ''}`}
              onClick={() => setSidebarTab('media')}
            >
              📁 Media
            </button>
            <button
              className={`tab ${sidebarTab === 'effects' ? 'active' : ''}`}
              onClick={() => setSidebarTab('effects')}
            >
              ✨ Effects
            </button>
            <button
              className={`tab ${sidebarTab === 'transitions' ? 'active' : ''}`}
              onClick={() => setSidebarTab('transitions')}
            >
              🎬 Trans
            </button>
            <button
              className={`tab ${sidebarTab === 'audio' ? 'active' : ''}`}
              onClick={() => setSidebarTab('audio')}
            >
              🔊 Audio
            </button>
          </div>

          {/* Media Panel */}
          {sidebarTab === 'media' && (
            <div className="panel">
              <label className="upload-btn">
                <input
                  type="file"
                  accept="video/*,image/*,audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                + Upload File
              </label>
              <div className="media-list">
                {state.tracks.flatMap(t => t.clips).map(clip => (
                  <div
                    key={clip.id}
                    className={`media-item ${clip.id === state.selectedClipId ? 'selected' : ''}`}
                    onClick={() => setState(prev => ({ ...prev, selectedClipId: clip.id }))}
                  >
                    <div className="media-thumbnail">📹</div>
                    <div className="media-info">
                      <p className="media-name">{clip.name}</p>
                      <p className="media-duration">{clip.duration}s</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Effects Panel */}
          {sidebarTab === 'effects' && (
            <div className="panel">
              <h3>Enhancement Tools</h3>
              <div className="effect-grid">
                <button
                  className="effect-btn"
                  onClick={handleUpscale}
                  title="Upscale to 1080p"
                >
                  <span>🎯</span>
                  <label>Upscale</label>
                </button>
                <button
                  className="effect-btn"
                  onClick={() => handleConvertFPS(30)}
                  title="Convert to 30fps"
                >
                  <span>⚡</span>
                  <label>30 FPS</label>
                </button>
              </div>

              <h3>Visual Effects</h3>
              <div className="effect-grid">
                {[
                  { name: 'grayscale', icon: '⚫' },
                  { name: 'blur', icon: '💫' },
                  { name: 'brightness', icon: '☀️' },
                ].map(effect => (
                  <button
                    key={effect.name}
                    className="effect-btn"
                    onClick={() => handleApplyEffect(effect.name)}
                  >
                    <span>{effect.icon}</span>
                    <label>{effect.name}</label>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transitions Panel */}
          {sidebarTab === 'transitions' && (
            <div className="panel">
              <h3>Transitions</h3>
              <div className="effect-grid">
                {['Fade', 'Slide', 'Zoom', 'Wipe'].map(trans => (
                  <button key={trans} className="effect-btn">
                    <span>→</span>
                    <label>{trans}</label>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio Panel */}
          {sidebarTab === 'audio' && (
            <div className="panel">
              <h3>Audio Controls</h3>
              <div className="audio-controls">
                <label>Volume</label>
                <input type="range" min="0" max="100" defaultValue="100" />
                <label>Speed</label>
                <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" />
              </div>
            </div>
          )}
        </aside>

        {/* Center: Preview + Timeline */}
        <div className="editor-center">
          {/* Preview */}
          <div className="preview-container">
            <div className="preview-wrapper">
              <video
                ref={previewRef}
                className="preview-video"
                src={selectedClip?.path}
                controls
              />
            </div>
            <div className="preview-info">
              {selectedClip && (
                <>
                  <h3>{selectedClip.name}</h3>
                  <p>{selectedClip.duration.toFixed(2)}s</p>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline-container">
            <div className="timeline-header">
              <button>−</button>
              <span>Zoom: {Math.round(state.zoom * 100)}%</span>
              <button>+</button>
            </div>

            <div className="timeline-tracks" ref={timelineRef}>
              {state.tracks.map(track => (
                <div key={track.id} className="track">
                  <div className="track-label">
                    <span>{track.type === 'video' ? '🎬' : '🔊'}</span>
                  </div>
                  <div className="track-clips">
                    {track.clips.map(clip => (
                      <div
                        key={clip.id}
                        className={`clip ${clip.id === state.selectedClipId ? 'selected' : ''}`}
                        onClick={() => setState(prev => ({ ...prev, selectedClipId: clip.id }))}
                        style={{
                          width: `${clip.duration * 50}px`,
                          left: `${clip.startTime * 50}px`,
                        }}
                      >
                        <span className="clip-name">{clip.name}</span>
                        {clip.effects.length > 0 && (
                          <div className="clip-effects">
                            {clip.effects.map(e => (
                              <span key={e} className="effect-tag">{e}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="timeline-controls">
              <button onClick={() => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}>
                {state.isPlaying ? '⏸' : '▶'}
              </button>
              <span>{state.currentTime.toFixed(2)}s</span>
            </div>
          </div>
        </div>

        {/* Right: Inspector */}
        <aside className="inspector">
          <h3>Properties</h3>
          {selectedClip ? (
            <div className="inspector-props">
              <div className="prop">
                <label>Clip Name</label>
                <input type="text" value={selectedClip.name} />
              </div>
              <div className="prop">
                <label>Speed</label>
                <input type="range" min="0.5" max="2" step="0.1" defaultValue={selectedClip.speed} />
              </div>
              <div className="prop">
                <label>Volume</label>
                <input type="range" min="0" max="100" defaultValue="100" />
              </div>
              <div className="prop">
                <label>Effects Applied</label>
                <div className="applied-effects">
                  {selectedClip.effects.length === 0 ? (
                    <p>None</p>
                  ) : (
                    selectedClip.effects.map(e => (
                      <span key={e} className="tag">{e} ✕</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="no-selection">Select a clip to view properties</p>
          )}
        </aside>
      </div>
    </div>
  );
}
