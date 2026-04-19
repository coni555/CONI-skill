#!/usr/bin/env bash
# Consolidation Trigger — runs on Stop hook
# Outputs 7-dimension consolidation prompt only when conversation is "heavy" enough.
# Lightweight: reads/writes a tiny state file, exits fast when not triggered.

set -euo pipefail

STATE_FILE="$HOME/.claude/projects/-Users-coni/memory/.consolidate-state"
MIN_INTERVAL=1800   # 30 min cooldown between triggers
MIN_STOPS=20        # minimum agent stops before eligible (proxy for conversation depth)

NOW=$(date +%s)

# --- Read state ---
last_trigger=0
stop_count=0
if [[ -f "$STATE_FILE" ]]; then
  last_trigger=$(sed -n '1p' "$STATE_FILE" 2>/dev/null || echo 0)
  stop_count=$(sed -n '2p' "$STATE_FILE" 2>/dev/null || echo 0)
fi

stop_count=$((stop_count + 1))

# --- Check conditions ---
elapsed=$((NOW - last_trigger))
if [[ $elapsed -lt $MIN_INTERVAL ]] || [[ $stop_count -lt $MIN_STOPS ]]; then
  # Not ready yet — update counter silently and exit
  printf '%s\n%s\n' "$last_trigger" "$stop_count" > "$STATE_FILE"
  exit 0
fi

# --- Trigger! Reset state ---
printf '%s\n%s\n' "$NOW" "0" > "$STATE_FILE"

# --- Output consolidation prompt ---
cat << 'PROMPT'
[沉淀检查] 对话已有足够深度，请扫描七维沉淀清单：

1. 任务闭环 — 当前任务是否已完成？结论是什么？
2. CLAUDE.md — 是否有新的行为规则需要写入？
3. Rules — 是否有可沉淀到 ~/cc-personal/rules/ 的新规则？
4. 架构决策 — 是否做了工具选型/技术方案/部署策略等非显然决策？
5. 项目里程碑 — 是否有项目状态推进值得记录？
6. 协作校准 — 用户是否做了价值观层面的纠正或确认了非显然做法？
7. 高价值分析 — 是否产出了可跨会话复用的分析框架或洞察？

命中 2+ 维度 → 执行 memory-engine Phase 3 checkpoint，向用户提出沉淀建议。
命中 0-1 维度 → 静默跳过，不打扰用户。
PROMPT
