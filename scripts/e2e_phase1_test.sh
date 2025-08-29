#!/usr/bin/env bash
# e2e_phase1_run_and_report.sh
# E2E test for Phase1: upload -> enqueue -> processing -> verify outputs -> produce Markdown report
# Usage:
#   ./e2e_phase1_run_and_report.sh [path/to/test_file.tif]
# Env vars:
#   API_BASE (optional) default: http://localhost:5000
#   REPORT_DIR (optional) default: ./e2e-reports
#   POLL_TIMEOUT_SECONDS (optional) default: 1200 (20 minutes)
#   POLL_INTERVAL (optional) default: 5 seconds

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5000}"
FILE="${1:-temp-uploads/test_geotiff.tif}"
REPORT_DIR="${REPORT_DIR:-./e2e-reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RAW_DIR="$REPORT_DIR/raw-$TIMESTAMP"
REPORT_FILE="$REPORT_DIR/phase1-e2e-report-$TIMESTAMP.md"
POLL_TIMEOUT_SECONDS=${POLL_TIMEOUT_SECONDS:-1200}
POLL_INTERVAL=${POLL_INTERVAL:-5}

mkdir -p "$REPORT_DIR" "$RAW_DIR"

echo "# Phase 1 E2E Test Report" > "$REPORT_FILE"
echo "Generated: $(date -u -Iseconds)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Environment" >> "$REPORT_FILE"
echo "- API_BASE: $API_BASE" >> "$REPORT_FILE"
echo "- Test file: $FILE" >> "$REPORT_FILE"
echo "- Timestamp: $TIMESTAMP" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# check dependencies
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is required"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required"; exit 1; }

# Step 1: Upload
echo "## Step 1 — Upload file" >> "$REPORT_FILE"
if [ ! -f "$FILE" ]; then
  echo "ERROR: test file not found: $FILE" | tee -a "$REPORT_FILE"
  exit 1
fi

echo "Uploading file..."
UPLOAD_START_TS=$(date +%s)
UPLOAD_RESPONSE="$(curl -s -X POST "$API_BASE/api/gis/upload" -F "file=@${FILE}" -H "Accept: application/json" || true)"
UPLOAD_END_TS=$(date +%s)
UPLOAD_SECONDS=$((UPLOAD_END_TS - UPLOAD_START_TS))

echo "Upload duration: ${UPLOAD_SECONDS}s" >> "$REPORT_FILE"
echo "$UPLOAD_RESPONSE" > "$RAW_DIR/upload_response.json"
echo '```json' >> "$REPORT_FILE"
jq . "$RAW_DIR/upload_response.json" >> "$REPORT_FILE" 2>/dev/null || cat "$RAW_DIR/upload_response.json" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Extract IDs
LAYER_ID="$(jq -r '.layerId // .id // .layer_id // empty' "$RAW_DIR/upload_response.json" 2>/dev/null || true)"
JOB_ID="$(jq -r '.jobId // .job_id // .job // empty' "$RAW_DIR/upload_response.json" 2>/dev/null || true)"

echo "Detected layerId: ${LAYER_ID:-(none)}" >> "$REPORT_FILE"
echo "Detected jobId: ${JOB_ID:-(none)}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Step 2: Polling job/layer status
echo "## Step 2 — Polling job/layer status" >> "$REPORT_FILE"
START_POLL_TS=$(date +%s)
END_TS=$((START_POLL_TS + POLL_TIMEOUT_SECONDS))
CURRENT_STATUS="unknown"
while [ "$(date +%s)" -le "$END_TS" ]; do
  STATUS=""
  # Try job endpoint if we have job id
  if [ -n "$JOB_ID" ]; then
    for prefix in "/api/jobs" "/api/gis/jobs" "/jobs" "/dispatcher/jobs"; do
      RESP="$(curl -s "$API_BASE${prefix}/${JOB_ID}" || true)"
      if [ -n "$RESP" ] && echo "$RESP" | jq -e . >/dev/null 2>&1; then
        STATUS="$(echo "$RESP" | jq -r '.status // .state // .result.status // empty')"
        break
      fi
    done
  fi

  # fallback: layer status
  if [ -z "$STATUS" ] || [ "$STATUS" == "null" ]; then
    if [ -n "$LAYER_ID" ]; then
      RESP2="$(curl -s "$API_BASE/api/gis/layers/$LAYER_ID/status" || true)"
      if [ -n "$RESP2" ] && echo "$RESP2" | jq -e . >/dev/null 2>&1; then
        STATUS="$(echo "$RESP2" | jq -r '.status // .state // empty')"
      else
        RESP3="$(curl -s "$API_BASE/api/gis/debug/layers" || true)"
        if [ -n "$RESP3" ] && echo "$RESP3" | jq -e . >/dev/null 2>&1; then
          LENTRY="$(echo "$RESP3" | jq -c --arg id "$LAYER_ID" '.layers[]? | select(.id==$id)')"
          if [ -n "$LENTRY" ]; then
            STATUS="$(echo "$LENTRY" | jq -r '.status // empty')"
          fi
        fi
      fi
    fi
  fi

  echo "$(date +%T) poll status: ${STATUS:-unknown}" >> "$RAW_DIR/poll.log"
  if [ -n "$STATUS" ]; then
    CURRENT_STATUS="$STATUS"
    if [[ "$STATUS" == "done" || "$STATUS" == "processed" || "$STATUS" == "success" ]]; then
      echo "Processing finished with status: $STATUS" >> "$REPORT_FILE"
      break
    fi
    if [[ "$STATUS" == "failed" || "$STATUS" == "error" ]]; then
      echo "Job failed with status: $STATUS" >> "$REPORT_FILE"
      break
    fi
  fi
  sleep $POLL_INTERVAL
done

if [[ "$CURRENT_STATUS" == "unknown" ]]; then
  echo "Timeout waiting for job/layer to finish after ${POLL_TIMEOUT_SECONDS}s" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Step 3: collect metadata and layer-state
echo "## Step 3 — Collect metadata & layer-state" >> "$REPORT_FILE"
METADATA_FILE_PATH="temp-uploads/processed/${LAYER_ID}/metadata.json"
LSTATE_FILE_PATH="temp-uploads/processed/${LAYER_ID}/layer-state.json"

if [ -n "$LAYER_ID" ] && [ -f "$METADATA_FILE_PATH" ]; then
  cp "$METADATA_FILE_PATH" "$RAW_DIR/metadata.json"
  echo '### metadata.json' >> "$REPORT_FILE"
  echo '```json' >> "$REPORT_FILE"
  jq . "$RAW_DIR/metadata.json" >> "$REPORT_FILE" 2>/dev/null || cat "$RAW_DIR/metadata.json" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
else
  if [ -n "$LAYER_ID" ]; then
    RESP_LAY="$(curl -s "$API_BASE/api/gis/layers/$LAYER_ID" || true)"
    if echo "$RESP_LAY" | jq -e . >/dev/null 2>&1; then
      echo "$RESP_LAY" > "$RAW_DIR/layer_api.json"
      echo '### Layer via API' >> "$REPORT_FILE"
      echo '```json' >> "$REPORT_FILE"
      jq . "$RAW_DIR/layer_api.json" >> "$REPORT_FILE"
      echo '```' >> "$REPORT_FILE"
    else
      echo "No metadata found on disk or via API for layerId $LAYER_ID" >> "$REPORT_FILE"
    fi
  fi
fi

if [ -f "$LSTATE_FILE_PATH" ]; then
  cp "$LSTATE_FILE_PATH" "$RAW_DIR/layer-state.json"
  echo '### layer-state.json' >> "$REPORT_FILE"
  echo '```json' >> "$REPORT_FILE"
  jq . "$RAW_DIR/layer-state.json" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
else
  echo "layer-state.json not found at $LSTATE_FILE_PATH" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Step 4: image headers and download
echo "## Step 4 — Image headers & download" >> "$REPORT_FILE"
IMAGE_URL=""

if [ -f "$RAW_DIR/metadata.json" ]; then
  IMAGE_FILE="$(jq -r '.imageFile // .output_image // empty' "$RAW_DIR/metadata.json" 2>/dev/null || true)"
  if [ -n "$IMAGE_FILE" ]; then
    IMAGE_URL="$API_BASE/api/gis/layers/${LAYER_ID}/image/${IMAGE_FILE}"
  fi
fi

if [ -z "$IMAGE_URL" ] && [ -f "$RAW_DIR/layer_api.json" ]; then
  IMAGE_URL="$(jq -r '.imageUrl // empty' "$RAW_DIR/layer_api.json")"
fi

if [ -n "$IMAGE_URL" ]; then
  echo "Image URL: $IMAGE_URL" >> "$REPORT_FILE"
  curl -sI "$IMAGE_URL" > "$RAW_DIR/image_headers.txt" || true
  echo '```' >> "$REPORT_FILE"
  cat "$RAW_DIR/image_headers.txt" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  IMG_OUT="$RAW_DIR/processed_image_$(basename "$IMAGE_URL")"
  curl -s -o "$IMG_OUT" "$IMAGE_URL" || true
  if [ -f "$IMG_OUT" ]; then
    echo "- Downloaded preview to $IMG_OUT" >> "$REPORT_FILE"
    if command -v md5sum >/dev/null 2>&1; then
      MD5=$(md5sum "$IMG_OUT" | awk '{print $1}')
      SIZE=$(stat -c%s "$IMG_OUT" || stat -f%z "$IMG_OUT")
      echo "- File size: ${SIZE} bytes" >> "$REPORT_FILE"
      echo "- MD5: ${MD5}" >> "$REPORT_FILE"
    fi
  else
    echo "- Could not download the image (check CORS/auth)" >> "$REPORT_FILE"
  fi
else
  echo "No image URL found to inspect." >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Step 5: worker logs (if docker-compose)
echo "## Step 5 — Worker logs (optional docker-compose capture)" >> "$REPORT_FILE"
if command -v docker-compose >/dev/null 2>&1 && [ -f docker-compose.phase1.yml ]; then
  echo "Collecting last 200 lines from 'worker' service..." >> "$REPORT_FILE"
  docker-compose -f docker-compose.phase1.yml logs --no-color --tail=200 worker > "$RAW_DIR/worker_logs.txt" || true
  echo '```' >> "$REPORT_FILE"
  tail -n 200 "$RAW_DIR/worker_logs.txt" >> "$REPORT_FILE" || true
  echo '```' >> "$REPORT_FILE"
else
  echo "- docker-compose not found or docker-compose.phase1.yml missing; skipping logs capture." >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "## Summary & Next steps" >> "$REPORT_FILE"
echo "- layerId: ${LAYER_ID:-(none)}" >> "$REPORT_FILE"
echo "- jobId: ${JOB_ID:-(none)}" >> "$REPORT_FILE"
echo "- final_status: ${CURRENT_STATUS:-(unknown)}" >> "$REPORT_FILE"
echo "- report_raw_dir: $RAW_DIR" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE"
echo "Raw files saved to: $RAW_DIR"
echo ""
echo "Done."