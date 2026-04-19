#!/bin/bash
# Extract audio from URL
# Usage: download-audio.sh <url> <output_dir> [format] [extra_args...]
#   format: mp3 (default), m4a, opus, flac, wav
set -eo pipefail

URL="$1"; shift
OUTPUT_DIR="${1:-$HOME/Videos}"; shift || true
AUDIO_FORMAT="${1:-mp3}"; shift || true
EXTRA_ARGS=("$@")

YT_DLP="/opt/homebrew/bin/yt-dlp"
mkdir -p "$OUTPUT_DIR"

echo "Extracting audio ($AUDIO_FORMAT) to: $OUTPUT_DIR"
$YT_DLP -x --audio-format "$AUDIO_FORMAT" --audio-quality 192K \
    -P "$OUTPUT_DIR" \
    -o "%(title)s.%(ext)s" \
    --no-overwrites \
    "${EXTRA_ARGS[@]}" \
    "$URL"

echo ""
echo "=== AUDIO EXTRACTION COMPLETE ==="
ls -lh "$OUTPUT_DIR"/*."$AUDIO_FORMAT" 2>/dev/null | tail -5 || echo "Check $OUTPUT_DIR for output files"
