/**
 * Test script for Flux2 Image Generation Service
 * 
 * This script tests the Flux2 service integration with ComfyUI
 * 
 * Usage:
 *   ts-node test-flux2-service.ts
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_JWT = process.env.TEST_JWT || 'your-test-jwt-token';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

async function testHealthCheck(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('🔍 Testing health check...');
    const response = await axios.post(
      `${BACKEND_URL}/api/flux2/health`,
      {},
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
        },
        timeout: 10000,
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success && response.data.connected) {
      return {
        test: 'Health Check',
        status: 'PASS',
        message: `ComfyUI is connected at ${response.data.url}`,
        duration,
      };
    } else {
      return {
        test: 'Health Check',
        status: 'FAIL',
        message: 'ComfyUI is not connected',
        duration,
      };
    }
  } catch (error: any) {
    return {
      test: 'Health Check',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testImageGeneration(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('🎨 Testing image generation...');
    
    const formData = new FormData();
    formData.append('prompt', 'A beautiful sunset over mountains, cinematic lighting, 8k quality');
    formData.append('enableTurbo', 'true');
    formData.append('steps', '8');
    formData.append('width', '1024');
    formData.append('height', '1024');
    formData.append('guidance', '4');

    const response = await axios.post(
      `${BACKEND_URL}/api/flux2/generate`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success && response.data.data.imagePath) {
      return {
        test: 'Image Generation',
        status: 'PASS',
        message: `Image generated successfully in ${(duration / 1000).toFixed(2)}s. URL: ${response.data.data.imagePath}`,
        duration,
      };
    } else {
      return {
        test: 'Image Generation',
        status: 'FAIL',
        message: 'Image generation failed - no image path returned',
        duration,
      };
    }
  } catch (error: any) {
    return {
      test: 'Image Generation',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testImageGenerationWithSeed(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('🎲 Testing image generation with seed...');
    
    const formData = new FormData();
    formData.append('prompt', 'A professional headshot, studio lighting');
    formData.append('enableTurbo', 'true');
    formData.append('steps', '8');
    formData.append('seed', '12345');

    const response = await axios.post(
      `${BACKEND_URL}/api/flux2/generate`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success && response.data.data.imagePath) {
      return {
        test: 'Image Generation with Seed',
        status: 'PASS',
        message: `Image generated with seed in ${(duration / 1000).toFixed(2)}s`,
        duration,
      };
    } else {
      return {
        test: 'Image Generation with Seed',
        status: 'FAIL',
        message: 'Image generation with seed failed',
        duration,
      };
    }
  } catch (error: any) {
    return {
      test: 'Image Generation with Seed',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testNormalMode(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('⚙️ Testing normal mode (20 steps)...');
    
    const formData = new FormData();
    formData.append('prompt', 'A futuristic city at night, neon lights');
    formData.append('enableTurbo', 'false');
    formData.append('steps', '20');

    const response = await axios.post(
      `${BACKEND_URL}/api/flux2/generate`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success && response.data.data.imagePath) {
      return {
        test: 'Normal Mode Generation',
        status: 'PASS',
        message: `Image generated in normal mode in ${(duration / 1000).toFixed(2)}s`,
        duration,
      };
    } else {
      return {
        test: 'Normal Mode Generation',
        status: 'FAIL',
        message: 'Normal mode generation failed',
        duration,
      };
    }
  } catch (error: any) {
    return {
      test: 'Normal Mode Generation',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testInvalidPrompt(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('❌ Testing invalid prompt...');
    
    const formData = new FormData();
    formData.append('prompt', ''); // Empty prompt
    formData.append('enableTurbo', 'true');

    const response = await axios.post(
      `${BACKEND_URL}/api/flux2/generate`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      }
    );

    const duration = Date.now() - startTime;

    // Should fail with validation error
    return {
      test: 'Invalid Prompt Handling',
      status: 'FAIL',
      message: 'Should have rejected empty prompt',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.response?.status === 400) {
      return {
        test: 'Invalid Prompt Handling',
        status: 'PASS',
        message: 'Correctly rejected invalid prompt',
        duration,
      };
    } else {
      return {
        test: 'Invalid Prompt Handling',
        status: 'FAIL',
        message: `Unexpected error: ${error.message}`,
        duration,
      };
    }
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(80));
  
  let passCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
    
    console.log(`\n${icon} ${result.test}${duration}`);
    console.log(`   ${result.message}`);
    
    if (result.status === 'PASS') {
      passCount++;
    } else {
      failCount++;
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('='.repeat(80) + '\n');

  if (failCount === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
  }
}

async function runTests() {
  console.log('🚀 Starting Flux2 Service Tests...\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`JWT Token: ${TEST_JWT.substring(0, 20)}...`);
  console.log('\n' + '='.repeat(80) + '\n');

  // Run tests sequentially
  results.push(await testHealthCheck());
  
  // Only run generation tests if health check passed
  if (results[0].status === 'PASS') {
    results.push(await testImageGeneration());
    results.push(await testImageGenerationWithSeed());
    results.push(await testNormalMode());
    results.push(await testInvalidPrompt());
  } else {
    console.log('\n⚠️ Skipping generation tests due to health check failure\n');
  }

  printResults();
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
