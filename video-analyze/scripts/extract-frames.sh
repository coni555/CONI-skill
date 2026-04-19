#!/bin/bash
# Extract key frames from a video at a calculated interval
# Usage: extract-frames.sh <video_path> <work_dir> [interval_seconds]

set -euo pipefail

VIDEO_PATH="$1"
WORK_DIR="$2"

# Get duration in seconds
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$VIDEO_PATH" | cut -d. -f1)

# Auto-calculate interval if not provided
if [ -n "${3:-}" ]; then
    INTERVAL="$3"
else
    if [ "$DURATION" -lt 10 ]; then
        INTERVAL=1
    elif [ "$DURATION" -lt 120 ]; then
        INTERVAL=5
    elif [ "$DURATION" -lt 900 ]; then
        INTERVAL=15
    elif [ "$DURATION" -lt 3600 ]; then
        INTERVAL=30
    else
        INTERVAL=60
    fi
fi

MAX_FRAMES=120
echo "Duration: ${DURATION}s | Interval: ${INTERVAL}s | Max frames: $MAX_FRAMES"

ffmpeg -i "$VIDEO_PATH" -vf "fps=1/$INTERVAL" -q:v 2 -frames:v "$MAX_FRAMES" "$WORK_DIR/frame_%04d.jpg" -y 2>/dev/null

FRAME_COUNT=$(ls "$WORK_DIR"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted $FRAME_COUNT frames to $WORK_DIR"
