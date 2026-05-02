/**
 * Script de test simple pour la génération vidéo
 * Utilisez ce code dans n'importe quel composant ou fonction
 */

import { generateVideo, createVideoParams } from './utils/videoGeneration'

export async function testQuickGeneration() {
  console.log('🎬 Starting quick video generation test...')

  const params = createVideoParams(
    'cinematic test, camera moving slowly, 4K',
    {
      width: 768,
      height: 432,
      length: 49, // ~2 secondes pour tester vite
      seed: 42,
      t2v_mode: true,
    }
  )

  try {
    const videoPath = await generateVideo(
      params,
      `test_${Date.now()}.mp4`,
      (progress) => {
        if (progress.status === 'generating') {
          console.log(`⏳ Progress: ${progress.attempt}/${progress.max}`)
        } else if (progress.status === 'done') {
          console.log('✅ Generation complete!')
        } else if (progress.status === 'error') {
          console.error('❌ Error:', progress.message)
        }
      }
    )

    console.log('✅ Video saved to:', videoPath)
    return videoPath
  } catch (error) {
    console.error('❌ Generation failed:', error)
    throw error
  }
}

// Pour l'utiliser dans un composant React:
// import { testQuickGeneration } from './test-generation'
// 
// const handleTest = async () => {
//   await testQuickGeneration()
// }
