import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface VideoParams {
  prompt: string
  negative_prompt?: string
  width: number
  height: number
  length: number
  frame_rate: number
  seed: number
  image_path?: string
  t2v_mode: boolean
}

export interface ProgressPayload {
  status: 'generating' | 'done' | 'error'
  attempt?: number
  max?: number
  filename?: string
  message?: string
}

/**
 * Generate a video using LTX model via ComfyUI
 * @param params Video generation parameters
 * @param savePath Path where the video will be saved
 * @param onProgress Optional callback for progress updates
 * @returns Path to the generated video
 */
export async function generateVideo(
  params: VideoParams,
  savePath: string,
  onProgress?: (payload: ProgressPayload) => void
): Promise<string> {
  // Listen to progress events if callback provided
  let unlisten: (() => void) | undefined

  if (onProgress) {
    unlisten = await listen<ProgressPayload>('video-progress', (event) => {
      onProgress(event.payload)
    })
  }

  try {
    const result = await invoke<string>('generate_ltx_video', {
      params,
      savePath,
    })
    return result
  } finally {
    // Clean up listener
    if (unlisten) {
      unlisten()
    }
  }
}

/**
 * Cancel the current video generation
 */
export async function cancelVideoGeneration(): Promise<void> {
  await invoke('cancel_video_generation')
}

/**
 * Get the current queue status from ComfyUI
 */
export async function getQueueStatus(): Promise<any> {
  return await invoke('get_queue_status')
}

/**
 * Helper to create video params with defaults
 */
export function createVideoParams(
  prompt: string,
  options?: Partial<VideoParams>
): VideoParams {
  return {
    prompt,
    negative_prompt: options?.negative_prompt || 'static, blurry, cartoon',
    width: options?.width || 1080,
    height: options?.height || 720,
    length: options?.length || 193, // ~8 seconds at 25fps
    frame_rate: options?.frame_rate || 25,
    seed: options?.seed || Math.floor(Math.random() * 999999999),
    image_path: options?.image_path,
    t2v_mode: options?.t2v_mode ?? true,
  }
}
