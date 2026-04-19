#!/bin/bash
# Extract audio and optionally transcribe with whisper
# Usage: extract-audio.sh <video_path> <work_dir> [language] [model]

set -euo pipefail

VIDEO_PATH="$1"
WORK_DIR="$2"
LANGUAGE="${3:-}"
MODEL="${4:-base}"

# Check if video has audio
HAS_AUDIO=$(ffprobe -v quiet -select_streams a -show_entries stream=codec_type -of csv=p=0 "$VIDEO_PATH" | head -1)

if [ -z "$HAS_AUDIO" ]; then
    echo "NO_AUDIO"
    exit 0
fi

# Extract audio as WAV
ffmpeg -i "$VIDEO_PATH" -vn -acodec pcm_s16le -ar 16000 -ac 1 "$WORK_DIR/audio.wav" -y 2>/dev/null
echo "Audio extracted to $WORK_DIR/audio.wav"

# Transcribe if whisper is available
if command -v whisper &>/dev/null; then
    WHISPER_ARGS="$WORK_DIR/audio.wav --model $MODEL --output_format txt --output_dir $WORK_DIR"
    if [ -n "$LANGUAGE" ]; then
        WHISPER_ARGS="$WHISPER_ARGS --language $LANGUAGE"
    fi
    echo "Transcribing with whisper (model: $MODEL)..."
    whisper $WHISPER_ARGS 2>/dev/null
    echo "Transcript saved to $WORK_DIR/audio.txt"
else
    echo "NO_WHISPER"
fi
