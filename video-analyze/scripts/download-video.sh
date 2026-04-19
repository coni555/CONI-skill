#!/bin/bash
# Download video from URL using yt-dlp
# Usage: download-video.sh <url> <work_dir> [max_height]

set -euo pipefail

URL="$1"
WORK_DIR="$2"
MAX_HEIGHT="${3:-720}"

mkdir -p "$WORK_DIR"

echo "Downloading: $URL (max ${MAX_HEIGHT}p)..."
yt-dlp -f "bestvideo[height<=${MAX_HEIGHT}]+bestaudio/best[height<=${MAX_HEIGHT}]" \
    --merge-output-format mp4 \
    -o "$WORK_DIR/source.mp4" \
    "$URL" 2>&1 | tail -5

echo "$WORK_DIR/source.mp4"
