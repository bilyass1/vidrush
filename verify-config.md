# Configuration Verification Checklist

## ✅ Backend Configuration

### File: `apps/backend/.env`
- [x] `LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"`
- [x] `BACKEND_URL="http://localhost:3001"`
- [x] `FRONTEND_URL="http://localhost:3000"`
- [x] `GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"`

### File: `apps/backend/src/video-generation/services/ltx.service.ts`
- [x] `checkHealth()` calls `/system_stats` endpoint
- [x] Fallback URL: `https://vault-folk-delivery-illustration.trycloudflare.com`

### File: `apps/backend/src/video/video.controller.ts`
- [x] `@Get('api-status')` endpoint exists
- [x] Calls `ltxService.checkHealth()`
- [x] Returns `{ ltxServer: { connected, url } }`

## ✅ Frontend Configuration

### File: `apps/web/.env.local`
- [x] `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

### File: `apps/web/src/app/dashboard/settings/page.tsx`
- [x] Calls `/api/video/api-status` (backend endpoint)
- [x] Does NOT call LTX server directly
- [x] Shows connection status from backend response

### File: `apps/web/src/lib/api.ts`
- [x] All API calls go to `API_URL` (backend)
- [x] No direct external server calls

## ✅ Desktop App Configuration

### File: `apps/desktop/src-tauri/src/comfyui.rs`
- [x] `const COMFY_URL: &str = "https://vault-folk-delivery-illustration.trycloudflare.com"`

## 🧪 Testing Steps

### 0. Test ComfyUI Server Directly (FIRST!)
```bash
# Run the test script
node test-comfyui-connection.js
```

This will test:
- `/system_stats` endpoint (health check)
- `/queue` endpoint (queue status)

Expected output:
```
✅ Status: 200 OK
📦 Response: { ... system stats ... }
```

If you get 401 or 404, the server URL or endpoint is wrong.

### 1. Test Backend Health Check
```bash
# Start backend
cd apps/backend
npm run start:dev

# In another terminal, test the endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/video/api-status
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

### 2. Test Frontend Connection
```bash
# Start frontend
cd apps/web
npm run dev

# Open browser
# Go to: http://localhost:3000/dashboard/settings
# Check "API Status" tab
# Should show: "Connected at https://vault-folk-delivery-illustration.trycloudflare.com"
```

### 3. Test Direct LTX Server
```bash
# Test if LTX server is reachable
curl https://vault-folk-delivery-illustration.trycloudflare.com/system_stats
```

Expected: JSON response with system information

### 4. Test Video Generation
```bash
# From frontend, try generating a video
# Monitor backend logs for LTX service calls
# Check that requests go to: https://vault-folk-delivery-illustration.trycloudflare.com/generate
```

## 🚨 Common Issues

### Issue: "Cannot reach server"
**Cause**: LTX server is down or unreachable
**Fix**: 
1. Check if `https://vault-folk-delivery-illustration.trycloudflare.com/system_stats` responds
2. Check firewall rules
3. Verify port 38063 is open

### Issue: "CORS error"
**Cause**: Frontend trying to call LTX directly
**Fix**: 
1. Verify frontend calls backend API, not LTX server
2. Check `apps/web/src/app/dashboard/settings/page.tsx`
3. Should call `/api/video/api-status`, not LTX URL

### Issue: "401 Unauthorized"
**Cause**: Missing or invalid JWT token
**Fix**:
1. Login to get fresh token
2. Check localStorage for 'jwt' key
3. Verify token is sent in Authorization header

### Issue: Backend can't reach LTX
**Cause**: Network issue or wrong URL
**Fix**:
1. From backend server, test: `curl https://vault-folk-delivery-illustration.trycloudflare.com/system_stats`
2. Check `LTX_SERVER_URL` in `.env`
3. Restart backend after changing `.env`

## 📝 Architecture Summary

```
Frontend (localhost:3000)
    ↓ calls /api/video/api-status
Backend (localhost:3001)
    ↓ calls /system_stats
LTX Server (vault-folk-delivery-illustration.trycloudflare.com)
```

**Key Point**: Frontend NEVER calls LTX server directly. All communication goes through the backend.
