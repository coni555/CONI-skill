# Frame Extraction Intervals

The `extract-frames.sh` script auto-calculates intervals, but you can override with a third argument.

| Duration | Auto Interval | Typical Frame Count | Notes |
|----------|--------------|---------------------|-------|
| < 10s | 1s | ≤10 | Every frame matters |
| 10s - 2min | 5s | 2-24 | Good for short clips |
| 2 - 15min | 15s | 8-60 | Standard content |
| 15 - 60min | 30s | 30-120 | Lectures, tutorials |
| > 60min | 60s | 60-120 | Ask user for time range first |

## When to Override

- **Screen recordings / tutorials**: Use shorter intervals (2-3s) — UI changes are dense
- **Landscape / slow video**: Use longer intervals (30-60s) — visual changes are sparse
- **Music videos / fast cuts**: Use shorter intervals (2-3s) — scenes change rapidly
- **Presentations / slides**: Use scene detection instead: `ffmpeg -i video.mp4 -vf "select='gt(scene,0.3)'" -vsync vfn frames/frame_%04d.jpg`
