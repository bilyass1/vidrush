/**
 * Check what models are available on the ComfyUI server
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const LTX_SERVER_URL = process.env.LTX_SERVER_URL ?? 'https://vault-folk-delivery-illustration.trycloudflare.com';

async function checkModels() {
  console.log('Checking ComfyUI server models...');
  console.log(`Server: ${LTX_SERVER_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Get object info (includes available models for each node type)
    const res = await axios.get(`${LTX_SERVER_URL}/object_info`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('\n📦 Available Models:\n');
    
    // Check VAE models
    if (res.data.VAELoader) {
      console.log('VAE Models:');
      const vaeModels = res.data.VAELoader.input.required.vae_name[0];
      vaeModels.forEach((model: string) => console.log(`  - ${model}`));
      console.log();
    }
    
    // Check CLIP models
    if (res.data.DualCLIPLoader) {
      console.log('CLIP Models (clip_name1):');
      const clip1Models = res.data.DualCLIPLoader.input.required.clip_name1[0];
      clip1Models.forEach((model: string) => console.log(`  - ${model}`));
      console.log();
      
      console.log('CLIP Models (clip_name2):');
      const clip2Models = res.data.DualCLIPLoader.input.required.clip_name2[0];
      clip2Models.forEach((model: string) => console.log(`  - ${model}`));
      console.log();
    }
    
    // Check UNET/Diffusion models
    if (res.data.UNETLoader) {
      console.log('UNET/Diffusion Models:');
      const unetModels = res.data.UNETLoader.input.required.unet_name[0];
      if (unetModels.length > 0) {
        unetModels.forEach((model: string) => console.log(`  - ${model}`));
      } else {
        console.log('  ❌ No UNET models found!');
      }
      console.log();
    }
    
    // Check if EmptyLTXVLatentVideo exists
    if (res.data.EmptyLTXVLatentVideo) {
      console.log('✅ EmptyLTXVLatentVideo node is available');
      console.log('   Inputs:', JSON.stringify(res.data.EmptyLTXVLatentVideo.input, null, 2));
    } else {
      console.log('❌ EmptyLTXVLatentVideo node NOT available');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Recommendation:');
    console.log('The ComfyUI server needs to have LTX Video 2.3 models installed:');
    console.log('  1. ltx-video-2.3-bf16.safetensors (UNET)');
    console.log('  2. ltx-video-2.3-vae-bf16.safetensors (VAE)');
    console.log('  3. t5xxl_fp16.safetensors (CLIP)');
    console.log('  4. clip_l.safetensors (CLIP)');
    console.log('\nOr export a working workflow from the ComfyUI web interface.');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkModels();
