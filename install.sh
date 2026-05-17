#!/bin/bash
# CONI-skill 一键安装脚本
# 用法: bash <(curl -s https://raw.githubusercontent.com/coni555/CONI-skill/main/install.sh) skill1 skill2 ...
# 不传参数 = 列出所有可用 skill

REPO="https://github.com/coni555/CONI-skill.git"
SKILL_DIR="$HOME/.claude/skills"
TMP_DIR=$(mktemp -d)

trap "rm -rf $TMP_DIR" EXIT

if [ $# -eq 0 ]; then
  echo ""
  echo "可用的 skill："
  echo "  content-to-html              — 中长文内容 → 沉浸式 HTML 深度阅读页"
  echo "  frontend-design              — 通用前端美学原则（content-to-html 可选依赖）"
  echo "  transcript-to-immersive-page — 逐字稿 → 沉浸式阅读页（content-to-html 早期版）"
  echo "  memory-engine                — 持久化记忆系统增强"
  echo "  user-lens                    — 用户思维协作模式"
  echo "  video-analyze                — 视频抽帧+音频分析"
  echo "  video-download               — yt-dlp 多平台视频下载"
  echo "  xiaohongshu-image-cards      — 长文 → 小红书竖版图文卡片"
  echo ""
  echo "用法: bash <(curl -s https://raw.githubusercontent.com/coni555/CONI-skill/main/install.sh) skill名"
  echo "示例: bash <(curl -s https://raw.githubusercontent.com/coni555/CONI-skill/main/install.sh) content-to-html frontend-design"
  exit 0
fi

echo "⏳ 正在克隆仓库..."
git clone --depth 1 --quiet "$REPO" "$TMP_DIR/repo"

if [ $? -ne 0 ]; then
  echo "❌ 克隆失败，请检查网络连接"
  exit 1
fi

mkdir -p "$SKILL_DIR"

for skill in "$@"; do
  if [ -d "$TMP_DIR/repo/$skill" ]; then
    cp -R "$TMP_DIR/repo/$skill" "$SKILL_DIR/"
    echo "✅ $skill → $SKILL_DIR/$skill"
  else
    echo "❌ $skill 不存在，跳过"
  fi
done

echo ""
echo "安装完成。重启 Claude Code 生效。"
