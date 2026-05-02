/**
 * Example usage of the video generation API
 */

import { generateVideo, createVideoParams, cancelVideoGeneration } from '../utils/videoGeneration'

// Example 1: Simple text-to-video generation
export async function simpleTextToVideo() {
  try {
    const params = createVideoParams(
      'cinematic battle scene, soldiers running forward, explosions in background, dramatic lighting',
      {
        negative_prompt: 'static, blurry, cartoon, childish, ugly',
        width: 1080,
        height: 720,
        seed: 42,
      }
    )

    const outputPath = await generateVideo(
      params,
      `output_${Date.now()}.mp4`,
      (progress) => {
        if (progress.status === 'generating') {
          console.log(`Progress: ${progress.attempt}/${progress.max}`)
        } else if (progress.status === 'done') {
          console.log('✅ Video generation complete!')
        } else if (progress.status === 'error') {
          console.error('❌ Error:', progress.message)
        }
      }
    )

    console.log('Video saved to:', outputPath)
    return outputPath
  } catch (error) {
    console.error('Failed to generate video:', error)
    throw error
  }
}

// Example 2: Image-to-video generation
export async function imageToVideo(imagePath: string) {
  try {
    const params = createVideoParams(
      'camera slowly zooming in, cinematic movement',
      {
        image_path: imagePath,
        t2v_mode: false, // Image-to-video mode
        width: 1080,
        height: 720,
      }
    )

    const outputPath = await generateVideo(params, `i2v_${Date.now()}.mp4`)

    console.log('Video saved to:', outputPath)
    return outputPath
  } catch (error) {
    console.error('Failed to generate video:', error)
    throw error
  }
}

// Example 3: Generation with cancellation
export async function generationWithCancellation() {
  const params = createVideoParams('epic landscape, mountains, sunset')

  // Start generation
  const generationPromise = generateVideo(
    params,
    `output_${Date.now()}.mp4`,
    (progress) => {
      console.log('Progress:', progress)
    }
  )

  // Cancel after 5 seconds (for demo purposes)
  setTimeout(async () => {
    console.log('Cancelling generation...')
    await cancelVideoGeneration()
  }, 5000)

  try {
    await generationPromise
  } catch (error) {
    console.log('Generation was cancelled or failed:', error)
  }
}

// Example 4: Batch generation
export async function batchGeneration(prompts: string[]) {
  const results: string[] = []

  for (const [index, prompt] of prompts.entries()) {
    console.log(`Generating video ${index + 1}/${prompts.length}`)

    try {
      const params = createVideoParams(prompt, {
        seed: index * 1000, // Different seed for each video
      })

      const outputPath = await generateVideo(
        params,
        `batch_${index}_${Date.now()}.mp4`
      )

      results.push(outputPath)
      console.log(`✅ Video ${index + 1} complete:`, outputPath)
    } catch (error) {
      console.error(`❌ Video ${index + 1} failed:`, error)
    }
  }

  return results
}

// Example 5: React component usage
export function useVideoGeneration() {
  // This would be used in a React component
  const handleGenerate = async () => {
    const params = createVideoParams(
      'cinematic scene with dramatic lighting',
      {
        width: 1920,
        height: 1080,
        length: 193, // ~8 seconds
      }
    )

    try {
      const path = await generateVideo(
        params,
        `video_${Date.now()}.mp4`,
        (progress) => {
          // Update UI with progress
          if (progress.status === 'generating' && progress.attempt && progress.max) {
            const percentage = (progress.attempt / progress.max) * 100
            console.log(`${percentage.toFixed(0)}%`)
          }
        }
      )

      console.log('Video ready:', path)
      return path
    } catch (error) {
      console.error('Generation failed:', error)
      throw error
    }
  }

  return { handleGenerate }
}
