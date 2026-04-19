---
name: video-analyze
description: Analyze video files or video URLs by extracting frames and audio with ffmpeg, then delivering structured key points. Default output is a concise summary with key takeaways — NOT a full transcript. Use when user wants to understand what a video is about, get key points, or analyze content without watching it.
---

# Video Analyze

Analyze a video (local file or URL) by extracting key frames + audio, then delivering structured key points.

**Default output**: structured key points summary — NOT a full transcript. Only produce verbatim transcription if user explicitly asks for it.

**Prerequisites**: `ffmpeg`, `yt-dlp` (for URLs). Optional: `whisper` (for transcription).

## Scripts

All scripts are in `scripts/` — use them instead of writing raw ffmpeg commands:

- **`scripts/download-video.sh <url> <work_dir> [max_height]`** — download video from URL (default 720p)
- **`scripts/probe-metadata.sh <video_path>`** — get JSON metadata (duration, resolution, codec, audio tracks)
- **`scripts/extract-frames.sh <video_path> <work_dir> [interval]`** — extract key frames with auto-calculated intervals
- **`scripts/extract-audio.sh <video_path> <work_dir> [language] [model]`** — extract audio + transcribe if whisper available

## Workflow

1. **Resolve input**: URL → run `download-video.sh`; local file → use directly
2. **Validate**: check `ffmpeg` exists; warn if `yt-dlp` / `whisper` missing
3. **Probe metadata**: run `probe-metadata.sh`, report duration/resolution/size
4. **Create work dir**: `WORK_DIR="/tmp/video-analyze-$(date +%s)"`
5. **Extract frames**: run `extract-frames.sh` (see `references/frame-intervals.md` for override guidance)
6. **Extract audio**: run `extract-audio.sh` (skip if no audio track; outputs "NO_AUDIO")
   - Whisper model selection: `tiny` for >1h, `base` for <30min — prioritize speed over verbatim accuracy since output is summary not transcript
7. **Analyze frames**: Read frames with Read tool in batches of ~20. Note visual content, on-screen text (OCR), scene changes, timestamps
8. **Read audio.txt**: extract topics, key arguments, notable quotes — do NOT reproduce verbatim text blocks
9. **Output report**: use template from `assets/report-template.md`
10. **Clean up**: ask user before `rm -rf "$WORK_DIR"`

## Gotchas

- **yt-dlp output path**: always use `-o "$WORK_DIR/source.mp4"` — without explicit output path, yt-dlp writes to cwd with unpredictable filenames
- **ffmpeg overwrite**: always pass `-y` flag or ffmpeg hangs waiting for interactive confirmation
- **whisper on long videos**: `--model base` is fine for <30min; use `--model tiny` for >30min or it takes forever
- **No audio ≠ error**: `extract-audio.sh` outputs "NO_AUDIO" string — check for this, don't treat as failure
- **Frame batch size**: Read tool handles ~20 images per batch well; more than that degrades analysis quality
- **Bilibili URLs**: yt-dlp supports them but sometimes needs `--cookies-from-browser` for age-gated content
- **Screen recordings**: default intervals miss rapid UI changes — override with 2-3s interval, emphasize OCR
- **Large files (>2GB)**: suggest `-ss START -to END` time range to user before processing full video
- **Whisper language detection**: auto-detection works poorly on mixed-language content — always ask user for language if unclear
- **Cleanup confirmation**: NEVER auto-delete work dir; always ask — user may want to keep frames for reference

## References

- `references/frame-intervals.md` — interval selection guide with override scenarios
- `assets/report-template.md` — output report template
