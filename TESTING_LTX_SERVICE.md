# Testing LTX Service with ComfyUI Workflow

## Quick Test Options

### Option 1: Test via TypeScript (Recommended)

This tests the actual LtxService class used by the backend.

```bash
cd apps/backend
npx ts-node test-ltx-service.ts
```

**What it does:**
- Creates an instance of LtxService
- Runs health check
- Generates a test video with prompt: "A serene ocean wave crashing on a sandy beach at sunset, cinematic, 4k"
- Returns the video URL

**Expected output:**
```
============================================================
Testing LTX Service with ComfyUI Workflow
============================================================

Step 1: Health Check
------------------------------------------------------------
Health check result: ✅ PASSED

Step 2: Generate Video
------------------------------------------------------------
Prompt: "A serene ocean wave crashing on a sandy beach at sunset, cinematic, 4k"

Submitting workflow to ComfyUI...
Workflow submitted, prompt_id: abc123...
Still waiting for video... (30s elapsed)
Still waiting for video... (60s elapsed)
Video ready: ComfyUI_00001.mp4

✅ Video generation completed!
------------------------------------------------------------
Job ID: abc123...
Video URL: https://seed-sperm-sustained-border.trycloudflare.com/api/view?filename=ComfyUI_00001.mp4&type=output&subfolder=
Duration: 4.04s
Dimensions: 768x432
FPS: 24
Time taken: 127.3s

============================================================
🎉 Test completed successfully!
============================================================
```

---

### Option 2: Test via PowerShell (Windows)

This tests the ComfyUI API directly without the backend.

```powershell
.\test-comfyui-workflow.ps1
```

**What it does:**
- Health check to `/system_stats`
- Submits workflow to `/api/prompt`
- Polls `/api/history/{promptId}` every 3 seconds
- Returns the video URL

---

### Option 3: Test via Bash (Linux/Mac)

```bash
chmod +x test-comfyui-workflow.sh
./test-comfyui-workflow.sh
```

Same as PowerShell version but for Unix systems.

---

### Option 4: Manual cURL Test

#### 1. Health Check
```bash
curl -H "Content-Type: application/json" \
  https://seed-sperm-sustained-border.trycloudflare.com/system_stats
```

#### 2. Submit Workflow
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d @workflow-payload.json \
  https://seed-sperm-sustained-border.trycloudflare.com/api/prompt
```

Where `workflow-payload.json` contains:
```json
{
  "prompt": {
    "6": {
      "inputs": {
        "text": "Your prompt here",
        "clip": ["11", 0]
      },
      "class_type": "CLIPTextEncode"
    },
    ...
  }
}
```

#### 3. Check History
```bash
curl -H "Content-Type: application/json" \
  https://seed-sperm-sustained-border.trycloudflare.com/api/history/YOUR_PROMPT_ID
```

#### 4. Get Video
```bash
# Once you have the filename from history
curl -o video.mp4 \
  "https://seed-sperm-sustained-border.trycloudflare.com/api/view?filename=ComfyUI_00001.mp4&type=output&subfolder="
```

---

## Testing via Backend API

If you want to test through the full backend stack:

### 1. Start the Backend
```bash
cd apps/backend
npm run start:dev
```

### 2. Make API Request

**Endpoint:** `POST http://localhost:3001/api/video-generation/generate`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "topic": "Ocean waves at sunset",
  "duration": 5,
  "genre": "nature",
  "market": "English"
}
```

**Response:**
```json
{
  "jobId": "abc123...",
  "status": "processing"
}
```

Then poll the status endpoint or wait for WebSocket notification.

---

## Testing via Frontend

### 1. Start Frontend
```bash
cd apps/web
npm run dev
```

### 2. Navigate to Video Test Page
```
http://localhost:3000/dashboard/video-test
```

### 3. Enter Prompt and Generate
- Enter a prompt like: "A serene ocean wave crashing on a sandy beach at sunset"
- Click "Generate Video"
- Wait for the video to appear

---

## Troubleshooting

### Health Check Fails
```
❌ Health check failed
```

**Solutions:**
1. Check if `LTX_SERVER_URL` is correct in `apps/backend/.env`
2. Verify ComfyUI server is running
3. Test the URL directly in browser: `https://seed-sperm-sustained-border.trycloudflare.com/system_stats`
4. Check if Cloudflare tunnel is active

### Workflow Submission Fails
```
❌ Failed to submit workflow
```

**Solutions:**
1. Check workflow JSON is valid: `apps/backend/src/ltx/workflows/video_ltx2_3_t2v.json`
2. Verify all required nodes are present
3. Check ComfyUI logs for errors
4. Ensure all models are loaded (LTX Video 2.3, VAE, CLIP)

### Video Generation Timeout
```
❌ Timeout: Video not ready after 600 seconds
```

**Solutions:**
1. Check ComfyUI server logs for generation errors
2. Verify GPU is available and working
3. Try with smaller dimensions (512x288 instead of 768x432)
4. Reduce number of frames (49 instead of 97)
5. Check if ComfyUI queue is stuck

### Video URL Returns 404
```
❌ Video file not found
```

**Solutions:**
1. Check the filename in the history response
2. Verify the output folder exists in ComfyUI
3. Check file permissions
4. Try accessing the URL directly in browser

---

## Expected Timings

- **Health Check:** < 1 second
- **Workflow Submission:** 1-3 seconds
- **Video Generation:** 60-180 seconds (depends on GPU, dimensions, frames)
- **Total Time:** ~2-3 minutes for a 4-second video

---

## Video Parameters

Default values used in tests:
- **Width:** 768px
- **Height:** 432px
- **Frames:** 97 (4 seconds at 24fps)
- **FPS:** 24
- **Steps:** 30
- **CFG Scale:** 7.5
- **Seed:** 42 (for reproducibility)

You can adjust these in the test scripts or API requests.
