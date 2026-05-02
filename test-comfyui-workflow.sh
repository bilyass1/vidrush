#!/bin/bash

# Test ComfyUI workflow submission
# This script tests the ComfyUI API directly without the backend

LTX_SERVER_URL="https://seed-sperm-sustained-border.trycloudflare.com"

echo "=========================================="
echo "Testing ComfyUI Workflow API"
echo "=========================================="
echo ""

# Step 1: Health check
echo "Step 1: Health Check"
echo "------------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$LTX_SERVER_URL/system_stats" | head -20
echo ""
echo ""

# Step 2: Submit workflow
echo "Step 2: Submit Workflow"
echo "------------------------------------------"

# Read the workflow JSON and patch the prompt
WORKFLOW=$(cat apps/backend/src/ltx/workflows/video_ltx2_3_t2v.json | \
  sed 's/PLACEHOLDER_PROMPT/A serene ocean wave crashing on a sandy beach at sunset, cinematic, 4k/')

echo "Submitting workflow..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": $WORKFLOW}" \
  "$LTX_SERVER_URL/api/prompt")

echo "Response:"
echo "$RESPONSE" | jq '.'

PROMPT_ID=$(echo "$RESPONSE" | jq -r '.prompt_id')
echo ""
echo "Prompt ID: $PROMPT_ID"
echo ""

if [ "$PROMPT_ID" = "null" ] || [ -z "$PROMPT_ID" ]; then
  echo "❌ Failed to get prompt_id"
  exit 1
fi

# Step 3: Poll history
echo "Step 3: Polling History (checking every 3 seconds)"
echo "------------------------------------------"

MAX_ATTEMPTS=200
ATTEMPT=0
VIDEO_FILENAME=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ -z "$VIDEO_FILENAME" ]; do
  ATTEMPT=$((ATTEMPT + 1))
  sleep 3
  
  HISTORY=$(curl -s -H "Content-Type: application/json" \
    "$LTX_SERVER_URL/api/history/$PROMPT_ID")
  
  # Check if video is ready
  VIDEO_FILENAME=$(echo "$HISTORY" | jq -r ".[\"$PROMPT_ID\"].outputs | to_entries[] | select(.value.gifs) | .value.gifs[0].filename" 2>/dev/null)
  
  if [ -z "$VIDEO_FILENAME" ] || [ "$VIDEO_FILENAME" = "null" ]; then
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
      echo "Still waiting... ($((ATTEMPT * 3))s elapsed)"
    fi
    VIDEO_FILENAME=""
  else
    echo "✅ Video ready: $VIDEO_FILENAME"
    break
  fi
done

if [ -z "$VIDEO_FILENAME" ]; then
  echo "❌ Timeout: Video not ready after $((MAX_ATTEMPTS * 3)) seconds"
  exit 1
fi

# Step 4: Construct video URL
echo ""
echo "Step 4: Video URL"
echo "------------------------------------------"
VIDEO_URL="$LTX_SERVER_URL/api/view?filename=$(echo $VIDEO_FILENAME | jq -Rr @uri)&type=output&subfolder="
echo "Video URL:"
echo "$VIDEO_URL"
echo ""
echo "=========================================="
echo "🎉 Test completed successfully!"
echo "=========================================="
echo ""
echo "You can view the video at:"
echo "$VIDEO_URL"
echo ""
echo "Or test in HTML:"
echo "<video src=\"$VIDEO_URL\" controls></video>"
