/**
 * Live test: health → submit workflow → poll history → print video URL
 * Run: node test-ltx-live.mjs
 */
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const BASE_URL = 'https://vault-folk-delivery-illustration.trycloudflare.com';
const WORKFLOW_PATH = 'apps/backend/src/ltx/workflows/video_ltx2_3_t2v.json';
const TEST_PROMPT = 'cinematic test, camera moving slowly, 4K';
const TEST_WIDTH = 768;
const TEST_HEIGHT = 432;
const TEST_LENGTH = 49; // ~2 seconds at 25fps

async function main() {
  // 1. Health check
  console.log(`\n[1] Health check → ${BASE_URL}/system_stats`);
  const health = await fetch(`${BASE_URL}/system_stats`, { signal: AbortSignal.timeout(8000) });
  if (!health.ok) throw new Error(`Health check failed: ${health.status}`);
  const stats = await health.json();
  console.log('    ✅ Server online. CUDA:', JSON.stringify(stats?.system?.cuda_version ?? 'n/a'));

  // 2. Load & patch workflow
  console.log(`\n[2] Loading workflow from ${WORKFLOW_PATH}`);
  const workflow = JSON.parse(readFileSync(WORKFLOW_PATH, 'utf-8'));
  if (!workflow['267:266']?.inputs) throw new Error('Node 267:266 not found in workflow!');

  // Patch all test parameters
  workflow['267:266'].inputs.value = TEST_PROMPT;       // prompt
  workflow['267:201'].inputs.value = true;               // t2v mode
  workflow['267:257'].inputs.value = TEST_WIDTH;         // width  768
  workflow['267:258'].inputs.value = TEST_HEIGHT;        // height 432
  workflow['267:225'].inputs.value = TEST_LENGTH;        // length 49 frames

  console.log(`    prompt  : "${TEST_PROMPT}"`);
  console.log(`    size    : ${TEST_WIDTH}x${TEST_HEIGHT}`);
  console.log(`    frames  : ${TEST_LENGTH} (~${(TEST_LENGTH/25).toFixed(1)}s @ 25fps)`);

  // 3. Submit to /api/prompt
  const clientId = randomUUID();
  console.log(`\n[3] POST ${BASE_URL}/api/prompt  (client_id: ${clientId})`);
  const submitRes = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, prompt: workflow }),
    signal: AbortSignal.timeout(30000),
  });
  if (!submitRes.ok) {
    const body = await submitRes.text();
    throw new Error(`Submit failed ${submitRes.status}: ${body}`);
  }
  const { prompt_id } = await submitRes.json();
  console.log(`    ✅ Queued! prompt_id: ${prompt_id}`);

  // 4. Poll /api/history every 3s (max 5 min for test)
  console.log(`\n[4] Polling ${BASE_URL}/api/history/${prompt_id} every 3s...`);
  const maxAttempts = 100;
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    process.stdout.write(`    attempt ${i}/${maxAttempts}... `);

    const histRes = await fetch(`${BASE_URL}/api/history/${prompt_id}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!histRes.ok) { console.log(`HTTP ${histRes.status}, retrying`); continue; }

    const data = await histRes.json();
    const entry = data[prompt_id];

    if (!entry?.outputs) { console.log('pending'); continue; }

    // Scan ALL nodes and ALL keys for any array containing a .mp4 filename
    let found = null;
    outer: for (const [nodeId, node] of Object.entries(entry.outputs)) {
      for (const [key, items] of Object.entries(node)) {
        if (Array.isArray(items)) {
          const video = items.find((i) => i.filename?.endsWith('.mp4'));
          if (video) { found = { nodeId, key, ...video }; break outer; }
        }
      }
    }

    if (found) {
      const { nodeId, key, filename, subfolder } = found;
      const videoUrl = `${BASE_URL}/api/view?filename=${encodeURIComponent(filename)}&type=output&subfolder=${encodeURIComponent(subfolder || '')}`;
      console.log(`DONE ✅ (node ${nodeId}.${key})`);
      console.log(`\n[5] Video URL:\n    ${videoUrl}\n`);
      return;
    }
  }

  throw new Error('Timed out waiting for video after 5 minutes');
}

main().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
