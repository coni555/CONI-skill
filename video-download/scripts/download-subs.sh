#!/bin/bash
# Download subtitles only (no video)
# Usage: download-subs.sh <url> <output_dir> [langs] [extra_args...]
#   langs: "all" (default), or pattern like "zh.*,en,ja"
set -eo pipefail

URL="$1"; shift
OUTPUT_DIR="${1:-$HOME/Videos}"; shift || true
LANGS="${1:-all}"; shift || true
EXTRA_ARGS=("$@")

YT_DLP="/opt/homebrew/bin/yt-dlp"
mkdir -p "$OUTPUT_DIR"

echo "Downloading subtitles ($LANGS) to: $OUTPUT_DIR"
$YT_DLP --write-subs --write-auto-subs \
    --sub-langs "$LANGS" \
    --sub-format "srt/vtt/ass" \
    --skip-download \
    -P "$OUTPUT_DIR" \
    -o "%(title)s.%(ext)s" \
    "${EXTRA_ARGS[@]}" \
    "$URL"

echo ""
echo "=== SUBTITLES DOWNLOADED ==="
ls -lh "$OUTPUT_DIR"/*.{srt,vtt,ass} 2>/dev/null || echo "No subtitle files found in $OUTPUT_DIR"
