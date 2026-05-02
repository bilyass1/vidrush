#!/usr/bin/env node

/**
 * Test script to verify ComfyUI server connectivity
 * Run with: node test-comfyui-connection.js
 */

const http = require('http');

const COMFY_URL = 'https://vault-folk-delivery-illustration.trycloudflare.com';

console.log('🔍 Testing ComfyUI Server Connection...\n');
console.log(`Target: ${COMFY_URL}/system_stats\n`);

// Test 1: /system_stats endpoint
function testSystemStats() {
  return new Promise((resolve, reject) => {
    const url = `${COMFY_URL}/system_stats`;
    console.log(`📡 GET ${url}`);
    
    const req = http.get(url, (res) => {
      console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`📦 Response:`, JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          console.log(`📦 Response (raw):`, data);
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Error:`, err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.error(`❌ Timeout after 5 seconds`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test 2: /queue endpoint
function testQueue() {
  return new Promise((resolve, reject) => {
    const url = `${COMFY_URL}/queue`;
    console.log(`\n📡 GET ${url}`);
    
    const req = http.get(url, (res) => {
      console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`📦 Response:`, JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          console.log(`📦 Response (raw):`, data);
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Error:`, err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.error(`❌ Timeout after 5 seconds`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Run tests
async function runTests() {
  try {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Test 1: /system_stats endpoint');
    console.log('───────────────────────────────────────────────────────');
    await testSystemStats();
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('Test 2: /queue endpoint');
    console.log('───────────────────────────────────────────────────────');
    await testQueue();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (err) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('❌ Tests failed!');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests();
