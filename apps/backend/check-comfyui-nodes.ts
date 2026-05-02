/**
 * Check what nodes are available on the ComfyUI server
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const LTX_SERVER_URL = process.env.LTX_SERVER_URL ?? 'https://vault-folk-delivery-illustration.trycloudflare.com';

async function checkNodes() {
  console.log('Checking ComfyUI server nodes...');
  console.log(`Server: ${LTX_SERVER_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Get object info (available nodes)
    const res = await axios.get(`${LTX_SERVER_URL}/object_info`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const nodes = Object.keys(res.data);
    console.log(`\nTotal nodes available: ${nodes.length}`);
    console.log('\nSearching for video-related nodes...\n');
    
    const videoNodes = nodes.filter(n => 
      n.toLowerCase().includes('video') || 
      n.toLowerCase().includes('ltx') ||
      n.toLowerCase().includes('save') ||
      n.toLowerCase().includes('vhs')
    );
    
    if (videoNodes.length > 0) {
      console.log('Video-related nodes found:');
      videoNodes.forEach(node => {
        console.log(`  - ${node}`);
        const nodeInfo = res.data[node];
        if (nodeInfo.output) {
          console.log(`    Output: ${JSON.stringify(nodeInfo.output)}`);
        }
      });
    } else {
      console.log('❌ No video-related nodes found!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\nChecking for required nodes:');
    
    const requiredNodes = [
      'CLIPTextEncode',
      'VAEDecode',
      'VAELoader',
      'DualCLIPLoader',
      'UNETLoader',
      'KSampler',
      'EmptyLTXVLatentVideo',
      'SaveImage',
      'VHS_VideoCombine'
    ];
    
    requiredNodes.forEach(node => {
      const exists = nodes.includes(node);
      console.log(`  ${exists ? '✅' : '❌'} ${node}`);
    });
    
    // Save full node list to file
    const fs = require('fs');
    fs.writeFileSync('comfyui-available-nodes.json', JSON.stringify(res.data, null, 2));
    console.log('\n✅ Full node list saved to: comfyui-available-nodes.json');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkNodes();
