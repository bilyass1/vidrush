# Test ComfyUI workflow submission (PowerShell version)
# This script tests the ComfyUI API directly without the backend

$LTX_SERVER_URL = "https://vault-folk-delivery-illustration.trycloudflare.com"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing ComfyUI Workflow API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health check
Write-Host "Step 1: Health Check" -ForegroundColor Yellow
Write-Host "------------------------------------------"
try {
    $healthResponse = Invoke-RestMethod -Uri "$LTX_SERVER_URL/system_stats" -Method Get -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json -Depth 3 | Select-Object -First 20)
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Submit workflow
Write-Host "Step 2: Submit Workflow" -ForegroundColor Yellow
Write-Host "------------------------------------------"

# Read and patch the workflow JSON
$workflowPath = "apps/backend/src/ltx/workflows/video_ltx2_3_t2v.json"
$workflowJson = Get-Content $workflowPath -Raw | ConvertFrom-Json

# Patch the prompt
$workflowJson.'6'.inputs.text = "A serene ocean wave crashing on a sandy beach at sunset, cinematic, 4k"

# Submit workflow
$body = @{
    prompt = $workflowJson
} | ConvertTo-Json -Depth 10

Write-Host "Submitting workflow..."
try {
    $promptResponse = Invoke-RestMethod -Uri "$LTX_SERVER_URL/api/prompt" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($promptResponse | ConvertTo-Json)
    
    $promptId = $promptResponse.prompt_id
    Write-Host ""
    Write-Host "Prompt ID: $promptId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to submit workflow: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Poll history
Write-Host "Step 3: Polling History (checking every 3 seconds)" -ForegroundColor Yellow
Write-Host "------------------------------------------"

$maxAttempts = 200
$attempt = 0
$videoFilename = $null

while ($attempt -lt $maxAttempts -and -not $videoFilename) {
    $attempt++
    Start-Sleep -Seconds 3
    
    try {
        $historyResponse = Invoke-RestMethod -Uri "$LTX_SERVER_URL/api/history/$promptId" -Method Get -ContentType "application/json" -TimeoutSec 10
        
        # Check if video is ready
        $historyData = $historyResponse.$promptId
        if ($historyData.outputs) {
            foreach ($nodeId in $historyData.outputs.PSObject.Properties.Name) {
                $output = $historyData.outputs.$nodeId
                if ($output.gifs -and $output.gifs.Count -gt 0) {
                    $videoFilename = $output.gifs[0].filename
                    Write-Host "✅ Video ready: $videoFilename" -ForegroundColor Green
                    break
                }
            }
        }
        
        if (-not $videoFilename -and ($attempt % 10 -eq 0)) {
            Write-Host "Still waiting... ($($attempt * 3)s elapsed)"
        }
    } catch {
        Write-Host "Warning: Poll attempt $attempt failed: $_" -ForegroundColor Yellow
    }
}

if (-not $videoFilename) {
    Write-Host "❌ Timeout: Video not ready after $($maxAttempts * 3) seconds" -ForegroundColor Red
    exit 1
}

# Step 4: Construct video URL
Write-Host ""
Write-Host "Step 4: Video URL" -ForegroundColor Yellow
Write-Host "------------------------------------------"
$encodedFilename = [System.Web.HttpUtility]::UrlEncode($videoFilename)
$videoUrl = "$LTX_SERVER_URL/api/view?filename=$encodedFilename&type=output&subfolder="
Write-Host "Video URL:" -ForegroundColor Green
Write-Host $videoUrl
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Test completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can view the video at:"
Write-Host $videoUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "Or test in HTML:"
Write-Host "<video src=`"$videoUrl`" controls></video>" -ForegroundColor Gray
