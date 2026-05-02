# Cloudflare Tunnel Issue - Error 1033

## Problem
The Cloudflare tunnel at `https://seed-sperm-sustained-border.trycloudflare.com` is experiencing connection issues (Error 1033, 502, 530).

## What Happened
1. ✅ Workflow was successfully submitted to ComfyUI (prompt_id: `081635bf-54b1-4fe9-9f6f-a99966be8868`)
2. ✅ Video generation started on the ComfyUI server
3. ❌ Cloudflare tunnel disconnected during polling
4. ❌ Cannot retrieve the generated video

## Error Codes
- **502**: Bad Gateway - Tunnel temporarily unavailable
- **530**: Origin DNS error - Cloudflare can't reach the origin
- **1033**: Cloudflare Tunnel error - Tunnel is down

## Solutions

### Option 1: Restart Cloudflare Tunnel (Recommended)
On the machine running ComfyUI:

```bash
# Find and stop the tunnel
pkill cloudflared

# Or if running as a service
sudo systemctl stop cloudflared

# Start the tunnel again
cloudflared tunnel run YOUR_TUNNEL_NAME

# Or as a service
sudo systemctl start cloudflared
```

### Option 2: Check Tunnel Status
```bash
# List all tunnels
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info YOUR_TUNNEL_NAME

# View tunnel logs
journalctl -u cloudflared -f
```

### Option 3: Use Direct IP Access
If you have direct network access to the ComfyUI server, bypass the tunnel:

**Update `apps/backend/.env`:**
```env
LTX_SERVER_URL="http://YOUR_SERVER_IP:8188"
```

Replace `YOUR_SERVER_IP` with the actual IP address of the ComfyUI server.

### Option 4: Wait and Check Manually
Once the tunnel is back online, check if the video was generated:

**Check history:**
```bash
curl https://seed-sperm-sustained-border.trycloudflare.com/api/history/081635bf-54b1-4fe9-9f6f-a99966be8868
```

**If video exists, download it:**
```bash
# The response will show the filename, then:
curl -o video.mp4 "https://seed-sperm-sustained-border.trycloudflare.com/api/view?filename=FILENAME&type=output&subfolder=video"
```

### Option 5: Use a More Stable Tunnel
Cloudflare free tunnels can be unstable. Consider:

1. **Named Tunnel (More Stable):**
```bash
# Create a named tunnel
cloudflared tunnel create my-comfyui-tunnel

# Configure it
cloudflared tunnel route dns my-comfyui-tunnel comfyui.yourdomain.com

# Run it
cloudflared tunnel run my-comfyui-tunnel
```

2. **ngrok (Alternative):**
```bash
ngrok http 8188
```

Then update `.env` with the ngrok URL.

3. **Tailscale (Private Network):**
```bash
tailscale up
```

Access ComfyUI via Tailscale IP.

## Prevention

### 1. Add Tunnel Health Monitoring
The updated `LtxService` now:
- Detects tunnel errors (502, 530, 503)
- Logs warnings when tunnel is down
- Provides manual check URL after 20 failed attempts

### 2. Use Tunnel with Authentication
Add authentication to prevent unauthorized access:

```bash
cloudflared tunnel run --url http://localhost:8188 --http-host-header localhost
```

### 3. Set Up Tunnel as a System Service
Make the tunnel auto-restart on failure:

```bash
# Install as service
sudo cloudflared service install

# Enable auto-restart
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## Current Status

**Prompt ID:** `081635bf-54b1-4fe9-9f6f-a99966be8868`

**To check if video is ready:**
1. Wait for tunnel to come back online
2. Visit: `https://seed-sperm-sustained-border.trycloudflare.com/api/history/081635bf-54b1-4fe9-9f6f-a99966be8868`
3. Look for `outputs.75.videos[0].filename`
4. Download from: `https://seed-sperm-sustained-border.trycloudflare.com/api/view?filename=FILENAME&type=output&subfolder=video`

## Next Steps

1. **Restart the Cloudflare tunnel** on the ComfyUI server
2. **Test the connection:**
   ```bash
   curl https://seed-sperm-sustained-border.trycloudflare.com/system_stats
   ```
3. **Re-run the test:**
   ```bash
   cd apps/backend
   npx ts-node test-ltx-service.ts
   ```

## Alternative: Local Testing
If you can't fix the tunnel right now, test with a local ComfyUI instance:

```bash
# Start ComfyUI locally
python main.py --listen 0.0.0.0 --port 8188

# Update .env
LTX_SERVER_URL="http://localhost:8188"

# Test
npx ts-node test-ltx-service.ts
```

---

**Note:** The code is working correctly. The issue is purely with the Cloudflare tunnel infrastructure, not your application.
