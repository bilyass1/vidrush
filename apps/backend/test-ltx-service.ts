/**
 * Test script for LTX Service with ComfyUI workflow
 * 
 * Usage:
 * 1. Make sure backend dependencies are installed: cd apps/backend && npm install
 * 2. Run: npx ts-node test-ltx-service.ts
 */

import { LtxService } from './src/video-generation/services/ltx.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testLtxService() {
  console.log('='.repeat(60));
  console.log('Testing LTX Service with ComfyUI Workflow');
  console.log('='.repeat(60));
  console.log();

  // Create service instance
  const ltxService = new LtxService();
  
  console.log('Step 1: Health Check');
  console.log('-'.repeat(60));
  
  const isHealthy = await ltxService.checkHealth();
  console.log(`Health check result: ${isHealthy ? '✅ PASSED' : '❌ FAILED'}`);
  console.log();
  
  if (!isHealthy) {
    console.error('❌ Health check failed. Cannot proceed with video generation.');
    console.error('Please check:');
    console.error('  1. LTX_SERVER_URL is correct in .env');
    console.error('  2. ComfyUI server is running');
    console.error('  3. Cloudflare tunnel is active');
    process.exit(1);
  }
  
  console.log('Step 2: Generate Video');
  console.log('-'.repeat(60));
  
  const testPrompt = 'A serene ocean wave crashing on a sandy beach at sunset, cinematic, 4k';
  console.log(`Prompt: "${testPrompt}"`);
  console.log();
  
  try {
    console.log('Submitting workflow to ComfyUI...');
    const startTime = Date.now();
    
    const result = await ltxService.generateClip({
      prompt: testPrompt,
      negativePrompt: 'worst quality, inconsistent motion, blurry, jittery, distorted',
      width: 768,
      height: 432,
      numFrames: 97,
      fps: 24,
      numInferenceSteps: 30,
      guidanceScale: 7.5,
      seed: 42,
    });
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log();
    console.log('✅ Video generation completed!');
    console.log('-'.repeat(60));
    console.log(`Job ID: ${result.jobId}`);
    console.log(`Video URL: ${result.videoPath}`);
    console.log(`Duration: ${result.durationSec.toFixed(2)}s`);
    console.log(`Dimensions: ${result.width}x${result.height}`);
    console.log(`FPS: ${result.fps}`);
    console.log(`Time taken: ${elapsedTime}s`);
    console.log();
    console.log('='.repeat(60));
    console.log('🎉 Test completed successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log('You can view the video at:');
    console.log(result.videoPath);
    console.log();
    console.log('Or test in browser:');
    console.log(`<video src="${result.videoPath}" controls></video>`);
    
  } catch (error: any) {
    console.error();
    console.error('❌ Video generation failed!');
    console.error('-'.repeat(60));
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testLtxService().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
