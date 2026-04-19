#!/bin/bash
# Download playlist
# Usage: download-playlist.sh <url> <output_dir> [options]
#   --range SPEC                Range, e.g., "1:5" for first 5
#   --audio-only                Extract audio instead of video
#   --cookies-from-browser B    Use browser cookies
set -eo pipefail

URL="$1"; shift
OUTPUT_DIR="${1:-$HOME/Videos}"; shift || true

YT_DLP="/opt/homebrew/bin/yt-dlp"
FORMAT="bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
AUDIO_ONLY=false
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --range)
            EXTRA_ARGS+=(-I "$2"); shift 2 ;;
        --audio-only)
            AUDIO_ONLY=true; shift ;;
        --cookies-from-browser)
            EXTRA_ARGS+=(--cookies-from-browser "$2"); shift 2 ;;
        *) EXTRA_ARGS+=("$1"); shift ;;
    esac
done

mkdir -p "$OUTPUT_DIR"

echo "Downloading playlist to: $OUTPUT_DIR"
if $AUDIO_ONLY; then
    $YT_DLP -x --audio-format mp3 --audio-quality 192K \
        --yes-playlist \
        -P "$OUTPUT_DIR" \
        -o "%(playlist_title)s/%(playlist_index)03d - %(title)s.%(ext)s" \
        --no-overwrites \
        "${EXTRA_ARGS[@]}" \
        "$URL"
else
    $YT_DLP -f "$FORMAT" \
        --merge-output-format mp4 \
        --yes-playlist \
        -P "$OUTPUT_DIR" \
        -o "%(playlist_title)s/%(playlist_index)03d - %(title)s.%(ext)s" \
        --no-overwrites \
        "${EXTRA_ARGS[@]}" \
        "$URL"
fi

echo ""
echo "=== PLAYLIST DOWNLOAD COMPLETE ==="
