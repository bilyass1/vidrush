# Debugging Guide - LTX/ComfyUI Connection Issues

## Current Issue: 401 Unauthorized

When the backend tries to check the LTX server health, it gets a 401 error. This guide helps diagnose and fix the issue.

## Architecture Reminder

```
Frontend → Backend → ComfyUI Server
         (NestJS)   (117.18.102.40:38063)
```

## Step-by-Step Debugging

### Step 1: Test ComfyUI Server Directly

Run the test script to verify the server is reachable:

```bash
node test-comfyui-connection.js
```

**Expected Results:**
- ✅ Status: 200 OK
- 📦 Response with system stats JSON

**Possible Issues:**

#### Issue A: Connection Refused
```
❌ Error: connect ECONNREFUSED vault-folk-delivery-illustration.trycloudflare.com
```
**Cause**: Server is down or port is blocked
**Fix**: 
1. Check if ComfyUI is running on the server
2. Verify firewall allows connections
3. Try: `curl https://vault-folk-delivery-illustration.trycloudflare.com/system_stats`

#### Issue B: Timeout
```
❌ Timeout after 5 seconds
```
**Cause**: Network issue or server not responding
**Fix**:
1. Check network connectivity
2. Test the URL: `curl https://vault-folk-delivery-illustration.trycloudflare.com/system_stats`

#### Issue C: 404 Not Found
```
✅ Status: 404 Not Found
```
**Cause**: Wrong endpoint URL
**Fix**:
1. ComfyUI might use different endpoints
2. Try: `curl https://vault-folk-delivery-illustration.trycloudflare.com/` (list available endpoints)
3. Common endpoints: `/queue`, `/history`, `/prompt`, `/system_stats`

#### Issue D: 401 Unauthorized
```
✅ Status: 401 Unauthorized
```
**Cause**: Server requires authentication OR wrong URL (redirecting to auth page)
**Fix**:
1. Check if this is actually ComfyUI or another service
2. ComfyUI typically doesn't require auth
3. Verify the IP and port are correct
4. Check if there's a reverse proxy adding auth

### Step 2: Check Backend Configuration

```bash
cd apps/backend
cat .env | grep LTX_SERVER_URL
```

Should show:
```
LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"
```

### Step 3: Check Backend Logs

Start the backend with logging:

```bash
cd apps/backend
npm run start:dev
```

Look for these log messages:
```
[LtxService] LTX Service initialized with baseUrl: https://vault-folk-delivery-illustration.trycloudflare.com
[LtxService] LTX_SERVER_URL from env: https://vault-folk-delivery-illustration.trycloudflare.com
```

When you check health (from frontend or API):
```
[LtxService] Checking LTX health at: https://vault-folk-delivery-illustration.trycloudflare.com/system_stats
[LtxService] LTX health check SUCCESS - Status: 200
```

Or if it fails:
```
[LtxService] LTX health check FAILED at https://vault-folk-delivery-illustration.trycloudflare.com/system_stats
[LtxService] Error: HTTP 401: Unauthorized
```

### Step 4: Test Backend API Endpoint

```bash
# Get a JWT token first (login via frontend)
# Then test the API:

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/video/api-status
```

Expected response:
```json
{
  "ltxServer": {
    "connected": true,
    "url": "https://vault-folk-delivery-illustration.trycloudflare.com"
  }
}
```

### Step 5: Check Frontend

Open browser console and go to:
```
http://localhost:3000/dashboard/settings
```

Check the Network tab:
1. Should see request to: `http://localhost:3001/api/video/api-status`
2. Should NOT see any request to `vault-folk-delivery-illustration.trycloudflare.com`
3. Response should show connection status

## Common Solutions

### Solution 1: Wrong Endpoint

ComfyUI might not have `/system_stats`. Try these alternatives:

**Option A: Use /queue endpoint**
```typescript
// In ltx.service.ts
async checkHealth(): Promise<boolean> {
  const healthUrl = `${this.baseUrl}/queue`;
  // ...
}
```

**Option B: Use /history endpoint**
```typescript
async checkHealth(): Promise<boolean> {
  const healthUrl = `${this.baseUrl}/history`;
  // ...
}
```

**Option C: Use root endpoint**
```typescript
async checkHealth(): Promise<boolean> {
  const healthUrl = `${this.baseUrl}/`;
  // ...
}
```

### Solution 2: Server Requires Authentication

If ComfyUI is behind a proxy that requires auth:

```typescript
// In ltx.service.ts
async checkHealth(): Promise<boolean> {
  const healthUrl = `${this.baseUrl}/system_stats`;
  const res = await firstValueFrom(
    this.httpService.get(healthUrl, { 
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN', // Add if needed
      },
    }),
  );
  // ...
}
```

### Solution 3: Use Different Port

If port 38063 is wrong, update everywhere:

1. `apps/backend/.env` → `LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"`
2. `apps/desktop/src-tauri/src/comfyui.rs` → `const COMFY_URL: &str = "https://vault-folk-delivery-illustration.trycloudflare.com"`
3. Restart backend

### Solution 4: Server is Actually Different Service

If `vault-folk-delivery-illustration.trycloudflare.com` is not ComfyUI:

1. Find the correct ComfyUI server URL
2. Update `LTX_SERVER_URL` in `.env`
3. Restart backend

## Verification Checklist

- [ ] `node test-comfyui-connection.js` returns 200 OK
- [ ] Backend logs show correct URL on startup
- [ ] Backend logs show health check attempts
- [ ] Frontend calls backend API (not ComfyUI directly)
- [ ] No CORS errors in browser console
- [ ] Settings page shows connection status

## Next Steps

Once the connection works:

1. Test video generation from frontend
2. Monitor backend logs for LTX service calls
3. Check that videos are generated successfully
4. Verify video files are stored correctly

## Need Help?

If still not working:

1. Share the output of `node test-comfyui-connection.js`
2. Share backend logs (especially LtxService lines)
3. Share any error messages from browser console
4. Confirm the ComfyUI server is actually running
