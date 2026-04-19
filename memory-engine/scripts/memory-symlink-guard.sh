#!/usr/bin/env bash
# Memory Symlink Guard — runs on Stop hook
#
# 扫描 ~/.claude/projects/*/memory，确保除主仓以外所有目录都是指向主仓的 symlink。
#
# 逻辑：
#   - 主仓本身：跳过
#   - 已是指向主仓的 symlink：跳过
#   - 是 symlink 但 target 错误：WARN，不自动修正
#   - 是真实目录且为空：自动替换为 symlink
#   - 是真实目录且非空：WARN，不自动处理（保护未知内容）
#
# 设计原则：幂等、失败静默退出、决不自动删除或覆盖非空目录

set -uo pipefail

MAIN="$HOME/.claude/projects/-Users-coni/memory"
PROJECTS_ROOT="$HOME/.claude/projects"

# 如果主仓不存在，直接退出（异常状态，不自动"修复"）
[[ ! -d "$MAIN" ]] && exit 0

# 解析主仓的规范路径（用于 symlink target 比对）
MAIN_REAL=$(cd "$MAIN" 2>/dev/null && pwd -P) || exit 0

warnings=""
converged=0

for dir in "$PROJECTS_ROOT"/*/memory; do
  # 主仓本身跳过
  [[ "$dir" == "$MAIN" ]] && continue

  if [[ -L "$dir" ]]; then
    # 已是 symlink，检查 target 是否正确
    target=$(readlink "$dir")
    target_real=$(cd "$dir" 2>/dev/null && pwd -P) || target_real=""
    if [[ "$target_real" != "$MAIN_REAL" ]]; then
      warnings="${warnings}WRONG_TARGET: $dir -> $target (expected $MAIN)\n"
    fi
    continue
  fi

  if [[ -d "$dir" ]]; then
    # 真实目录：检查是否为空（忽略 . 和 ..）
    if [[ -z "$(ls -A "$dir" 2>/dev/null)" ]]; then
      # 空目录，自动收敛
      rmdir "$dir" 2>/dev/null && ln -s "$MAIN" "$dir" && converged=$((converged + 1))
    else
      # 非空，不自动处理
      file_count=$(ls -A "$dir" 2>/dev/null | wc -l | tr -d ' ')
      warnings="${warnings}NON_EMPTY: $dir ($file_count files) — manual migration required\n"
    fi
  fi
done

# 输出结果（仅在有事件时）
if [[ -n "$warnings" ]] || [[ $converged -gt 0 ]]; then
  echo "[memory-symlink-guard] $(date '+%H:%M:%S')"
  [[ $converged -gt 0 ]] && echo "  converged: $converged empty directories → symlinks"
  [[ -n "$warnings" ]] && printf '  %b' "$warnings"
fi

exit 0
