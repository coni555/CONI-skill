#!/bin/bash
# Download single video
# Usage: download-video.sh <url> <output_dir> [options]
#   --max-height N              Limit resolution (e.g., 720, 1080)
#   --format FORMAT             Custom yt-dlp format string
#   --recode FORMAT             Re-encode to format (mp4, webm, mkv)
#   --embed-subs                Embed subtitles into video
#   --embed-thumbnail           Embed thumbnail as cover art
#   --cookies-from-browser B    Use browser cookies
set -eo pipefail

URL="$1"; shift
OUTPUT_DIR="${1:-$HOME/Videos}"; shift || true

YT_DLP="/opt/homebrew/bin/yt-dlp"
FORMAT="bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
MERGE_FORMAT="mp4"
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --max-height)
            FORMAT="bestvideo[height<=${2}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${2}]+bestaudio/best[height<=${2}]"
            shift 2 ;;
        --format)
            FORMAT="$2"; shift 2 ;;
        --recode)
            EXTRA_ARGS+=(--recode-video "$2"); MERGE_FORMAT="$2"; shift 2 ;;
        --embed-subs)
            EXTRA_ARGS+=(--embed-subs --write-subs --write-auto-subs --sub-langs "all"); shift ;;
        --embed-thumbnail)
            EXTRA_ARGS+=(--embed-thumbnail); shift ;;
        --cookies-from-browser)
            EXTRA_ARGS+=(--cookies-from-browser "$2"); shift 2 ;;
        *) EXTRA_ARGS+=("$1"); shift ;;
    esac
done

mkdir -p "$OUTPUT_DIR"

echo "Downloading to: $OUTPUT_DIR"
$YT_DLP -f "$FORMAT" \
    --merge-output-format "$MERGE_FORMAT" \
    -P "$OUTPUT_DIR" \
    -o "%(title)s.%(ext)s" \
    --no-overwrites \
    --progress \
    "${EXTRA_ARGS[@]}" \
    "$URL"

echo ""
echo "=== DOWNLOAD COMPLETE ==="
# Show downloaded file info
FILENAME=$($YT_DLP --print filename -f "$FORMAT" --merge-output-format "$MERGE_FORMAT" -P "$OUTPUT_DIR" -o "%(title)s.%(ext)s" "$URL" 2>/dev/null || true)
if [[ -n "$FILENAME" && -f "$FILENAME" ]]; then
    echo "File: $FILENAME"
    echo "Size: $(du -h "$FILENAME" | cut -f1)"
fi
