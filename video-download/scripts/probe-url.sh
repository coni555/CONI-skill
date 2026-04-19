#!/bin/bash
# Probe URL for metadata without downloading
# Usage: probe-url.sh <url> [extra_args...]
set -eo pipefail

URL="$1"
shift
EXTRA_ARGS=("$@")

YT_DLP="/opt/homebrew/bin/yt-dlp"

echo "=== VIDEO INFO ==="
$YT_DLP --no-download \
    --print "Title: %(title)s" \
    --print "Duration: %(duration_string)s" \
    --print "Uploader: %(uploader)s" \
    "${EXTRA_ARGS[@]}" "$URL" 2>/dev/null || echo "Failed to get basic info"

echo ""
echo "=== FORMATS ==="
$YT_DLP -F "${EXTRA_ARGS[@]}" "$URL" 2>/dev/null | tail -30 || echo "Failed to list formats"

echo ""
echo "=== SUBTITLES ==="
$YT_DLP --list-subs "${EXTRA_ARGS[@]}" "$URL" 2>&1 | grep -E "^[a-z]{2}|Available|Language" | head -20 || echo "No subtitles found"

echo ""
echo "=== PLAYLIST CHECK ==="
PLAYLIST_COUNT=$($YT_DLP --flat-playlist --print id "${EXTRA_ARGS[@]}" "$URL" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$PLAYLIST_COUNT" -gt 1 ]]; then
    echo "Playlist detected: $PLAYLIST_COUNT entries"
else
    echo "Single video (not a playlist)"
fi
