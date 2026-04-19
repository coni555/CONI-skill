# CONI-skill

coni 个人创建的 Claude Code / Codex Skill 合集。

## Skills

| Skill | 说明 |
| --- | --- |
| [memory-engine](./memory-engine) | 持久化记忆系统增强：结构化保存工作流、decision 类型、token 预算追踪、健康检查审计 |
| [user-lens](./user-lens) | 用户思维协作模式，运营策划/增长方案/落地页/文案/活动设计专用，手动 `/user-lens` 激活 |
| [video-analyze](./video-analyze) | 用 ffmpeg 抽帧 + 抽音频分析本地视频或 URL，默认输出结构化要点（而非整段转录） |
| [video-download](./video-download) | 基于 yt-dlp，下载 YouTube / Bilibili / Twitter / Instagram 等 1000+ 站点的视频、音频、字幕 |
| [xiaohongshu-image-cards](./xiaohongshu-image-cards) | 将长文转换为小红书 3:4 竖版图文卡片并导出 PNG |

## 安装

Claude Code skill 复制到 `~/.claude/skills/`，Codex skill 复制到 `~/.codex/skills/`：

```bash
# 例：安装 memory-engine 到 Claude Code
cp -R memory-engine ~/.claude/skills/

# 例：安装 xiaohongshu-image-cards 到 Codex
cp -R xiaohongshu-image-cards ~/.codex/skills/
```
