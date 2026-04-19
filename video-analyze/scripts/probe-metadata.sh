#!/bin/bash
# Probe video metadata and output key info
# Usage: probe-metadata.sh <video_path>

set -euo pipefail

VIDEO_PATH="$1"

ffprobe -v quiet -print_format json -show_format -show_streams "$VIDEO_PATH"
