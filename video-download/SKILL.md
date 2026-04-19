---
name: video-download
description: >-
  Download videos, audio, and subtitles from YouTube, Bilibili, Twitter/X, Instagram and 1000+ sites using yt-dlp.
  Handles single video download, audio extraction (mp3/m4a/flac), subtitle download, playlist batch download,
  format selection, and video conversion. Downloads to ~/Videos by default.
  If user mentions downloading a video, extracting audio from a URL, getting subtitles, saving a playlist,
  ripping audio, converting video format, or pastes a video URL, use this skill.
  Do NOT use for video analysis, transcription, or frame extraction — use video-analyze instead.
---

# Video Download

Download videos, audio, and subtitles from URLs using yt-dlp. Supports 1000+ sites.

**Prerequisites**: `yt-dlp`, `ffmpeg` (for audio extraction and format conversion).

## Scripts

All scripts are in `scripts/` — use them instead of writing raw yt-dlp commands:

- **`scripts/probe-url.sh <url> [extra_args...]`** — probe URL metadata (title, formats, subtitles, playlist info). Always run first.
- **`scripts/download-video.sh <url> <output_dir> [options...]`** — download video with format selection
- **`scripts/download-audio.sh <url> <output_dir> [format] [extra_args...]`** — extract audio only (default: mp3)
- **`scripts/download-subs.sh <url> <output_dir> [langs] [extra_args...]`** — download subtitles only
- **`scripts/download-playlist.sh <url> <output_dir> [options...]`** — batch download playlist

## Workflow

### Phase 1: Probe

Always start by probing the URL.

1. Run `scripts/probe-url.sh <url>` to get title, available formats, subtitles, and playlist info.
2. If probe fails with "Sign in" or "403", retry with cookies:
   ```bash
   scripts/probe-url.sh <url> --cookies-from-browser chrome
   ```
   For Bilibili, cookies are almost always needed — see `references/platform-notes.md`.
3. Report probe results to user before downloading if they asked about formats/quality. Otherwise proceed directly.

### Phase 2: Route

Based on user request + probe results, pick the action:

| User intent | Script | Default behavior |
|---|---|---|
| "下载视频" / "download this" / just a URL | `download-video.sh` | Best quality mp4 |
| "720p" / specific resolution | `download-video.sh --max-height N` | Validated against probe |
| "提取音频" / "mp3" / "rip audio" | `download-audio.sh` | mp3 192k |
| "下载字幕" / "get subtitles" | `download-subs.sh` | All available languages |
| "播放列表" / "download playlist" | `download-playlist.sh` | Confirm if >10 items |
| Format conversion | `download-video.sh --recode FORMAT` | Re-encode after download |

**Default**: user pastes a URL without specifying → download best quality mp4. Don't ask, just download.

### Phase 3: Download

Run the appropriate script. All scripts default to `~/Videos` as output directory.

After download completes, report:
- File path (absolute)
- File size
- Resolution and format (for video)
- Duration

### Phase 4: Post-processing (only if requested)

- **Embed subtitles**: `download-video.sh <url> ~/Videos --embed-subs`
- **Embed thumbnail**: `download-video.sh <url> ~/Videos --embed-thumbnail`
- **Format conversion**: `download-video.sh <url> ~/Videos --recode webm`

## Gotchas

- **~/Videos**: create with `mkdir -p` if it doesn't exist (scripts handle this)
- **Bilibili**: almost always needs `--cookies-from-browser chrome`. Auto-retry with cookies if first attempt fails. See `references/platform-notes.md`
- **Large playlists**: confirm with user before downloading >10 items
- **Format not available**: show available formats from probe, ask user to pick
- **Geo-restricted**: suggest VPN if download fails with "not available in your country"
- **Live streams**: warn user — use `--live-from-start` for VOD capture
- **Filename conflicts**: yt-dlp auto-handles, no manual intervention needed
- **Cookie failures**: if `--cookies-from-browser chrome` fails, try `firefox` or `safari`

## Quick Reference

| Task | Command |
|---|---|
| Best quality mp4 | `download-video.sh URL ~/Videos` |
| 720p | `download-video.sh URL ~/Videos --max-height 720` |
| Audio mp3 | `download-audio.sh URL ~/Videos mp3` |
| Audio m4a | `download-audio.sh URL ~/Videos m4a` |
| Subtitles (all) | `download-subs.sh URL ~/Videos all` |
| Subtitles (zh,en) | `download-subs.sh URL ~/Videos "zh.*,en"` |
| Playlist | `download-playlist.sh URL ~/Videos` |
| Playlist range | `download-playlist.sh URL ~/Videos --range 1:5` |
| Playlist audio only | `download-playlist.sh URL ~/Videos --audio-only` |
