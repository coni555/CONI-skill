#!/usr/bin/env bash
# Memory Health Check — audits ~/.claude/projects/-Users-coni/memory/
# Pure read-only, outputs structured report to stdout.

set -euo pipefail

MEMORY_DIR="$HOME/.claude/projects/-Users-coni/memory"
INDEX_FILE="$MEMORY_DIR/MEMORY.md"
BUDGET_CAP=40000
NOW=$(date +%s)
STALE_DAYS=30

# --- Helpers ---

estimate_tokens() {
  local bytes
  bytes=$(wc -c < "$1" 2>/dev/null || echo 0)
  echo $(( bytes * 10 / 32 ))  # bytes / 3.2, integer math
}

get_type() {
  sed -n '/^---$/,/^---$/p' "$1" 2>/dev/null | grep "^type:" | head -1 | sed 's/^type:[[:space:]]*//'
}

days_since_modified() {
  local mod_epoch
  if [[ "$(uname)" == "Darwin" ]]; then
    mod_epoch=$(stat -f %m "$1" 2>/dev/null || echo "$NOW")
  else
    mod_epoch=$(stat -c %Y "$1" 2>/dev/null || echo "$NOW")
  fi
  echo $(( (NOW - mod_epoch) / 86400 ))
}

# --- Collect Data ---

# Type counters (using flat variables instead of associative arrays for sh compat)
count_user=0; count_feedback=0; count_project=0; count_reference=0; count_decision=0; count_other=0
tk_user=0; tk_feedback=0; tk_project=0; tk_reference=0; tk_decision=0; tk_other=0
total_tokens=0
total_files=0
issues=""
file_sizes=""

for f in "$MEMORY_DIR"/*.md; do
  [[ "$(basename "$f")" == "MEMORY.md" ]] && continue
  [[ ! -f "$f" ]] && continue

  total_files=$((total_files + 1))
  fname=$(basename "$f")
  tokens=$(estimate_tokens "$f")
  total_tokens=$((total_tokens + tokens))
  file_sizes="${file_sizes}${tokens} ${fname}\n"

  # Type distribution
  ftype=$(get_type "$f")
  case "$ftype" in
    user)      count_user=$((count_user + 1));      tk_user=$((tk_user + tokens)) ;;
    feedback)  count_feedback=$((count_feedback + 1)); tk_feedback=$((tk_feedback + tokens)) ;;
    project)   count_project=$((count_project + 1));  tk_project=$((tk_project + tokens)) ;;
    reference) count_reference=$((count_reference + 1)); tk_reference=$((tk_reference + tokens)) ;;
    decision)  count_decision=$((count_decision + 1)); tk_decision=$((tk_decision + tokens)) ;;
    *)         count_other=$((count_other + 1));     tk_other=$((tk_other + tokens)) ;;
  esac

  # Staleness
  days=$(days_since_modified "$f")
  if [[ $days -ge $STALE_DAYS ]]; then
    issues="${issues}- STALE: ${fname} (${days} days since last update)\n"
  fi

  # Orphan check
  if ! grep -q "$fname" "$INDEX_FILE" 2>/dev/null; then
    issues="${issues}- ORPHAN: ${fname} — exists in memory/ but not indexed in MEMORY.md\n"
  fi
done

# Broken link check
while IFS= read -r link; do
  if [[ ! -f "$MEMORY_DIR/$link" ]]; then
    issues="${issues}- BROKEN LINK: ${link} — referenced in MEMORY.md but file missing\n"
  fi
done < <(grep -oE '\(([a-zA-Z0-9_-]+\.md)\)' "$INDEX_FILE" 2>/dev/null | tr -d '()' | sort -u)

# Type emptiness check
[[ $count_user -eq 0 ]] && issues="${issues}- NO ENTRIES: type 'user' has 0 files\n"
[[ $count_feedback -eq 0 ]] && issues="${issues}- NO ENTRIES: type 'feedback' has 0 files\n"
[[ $count_project -eq 0 ]] && issues="${issues}- NO ENTRIES: type 'project' has 0 files\n"
[[ $count_reference -eq 0 ]] && issues="${issues}- NO ENTRIES: type 'reference' has 0 files\n"
[[ $count_decision -eq 0 ]] && issues="${issues}- NO ENTRIES: type 'decision' has 0 files\n"

index_tokens=$(estimate_tokens "$INDEX_FILE")
pct=$((total_tokens * 100 / BUDGET_CAP))

[[ $pct -ge 80 ]] && issues="${issues}- BUDGET WARNING: memory usage at ${pct}%, consider compacting\n"

# --- Output Report ---

echo "## Memory Health Report"
echo ""
echo "**Budget:** ~${total_tokens}tk / ${BUDGET_CAP}tk (${pct}%) — index: ~${index_tokens}tk"
echo "**Files:** ${total_files} memory files + 1 index"
echo ""

echo "### Type Distribution"
echo "| Type | Count | Tokens |"
echo "|------|-------|--------|"
echo "| user | ${count_user} | ~${tk_user}tk |"
echo "| feedback | ${count_feedback} | ~${tk_feedback}tk |"
echo "| project | ${count_project} | ~${tk_project}tk |"
echo "| reference | ${count_reference} | ~${tk_reference}tk |"
echo "| decision | ${count_decision} | ~${tk_decision}tk |"
[[ $count_other -gt 0 ]] && echo "| other | ${count_other} | ~${tk_other}tk |"
echo ""

echo "### Top 5 by Size"
printf '%b' "$file_sizes" | sort -rn | head -5 | while read -r tk fname; do
  echo "- ${fname} \`~${tk}tk\`"
done
echo ""

echo "### Growth Activity"
recent_7d=""
recent_30d=""
for f in "$MEMORY_DIR"/*.md; do
  [[ "$(basename "$f")" == "MEMORY.md" ]] && continue
  [[ ! -f "$f" ]] && continue
  fname=$(basename "$f")
  days=$(days_since_modified "$f")
  ftype=$(get_type "$f")
  if [[ $days -le 7 ]]; then
    recent_7d="${recent_7d}- ${fname} (${ftype}, ${days}d ago)\n"
  elif [[ $days -le 30 ]]; then
    recent_30d="${recent_30d}- ${fname} (${ftype}, ${days}d ago)\n"
  fi
done

if [[ -n "$recent_7d" ]]; then
  echo "**Last 7 days:**"
  printf '%b' "$recent_7d"
else
  echo "**Last 7 days:** no changes"
fi

if [[ -n "$recent_30d" ]]; then
  echo "**8-30 days ago:**"
  printf '%b' "$recent_30d"
fi
echo ""

echo "### Dimension Coverage"
echo "| Dimension | Status | Evidence |"
echo "|-----------|--------|----------|"
# Check each consolidation dimension by proxy
has_claude_rules=$(ls "$HOME/cc-personal/rules/"*.md 2>/dev/null | wc -l | tr -d ' ')
has_decisions=$count_decision
has_feedback=$count_feedback
has_projects=$count_project
has_references=$count_reference
has_user=$count_user

dim_score=0
if [[ $has_user -gt 0 ]]; then echo "| User profile | ✓ | ${count_user} files |"; dim_score=$((dim_score+1)); else echo "| User profile | ✗ | no user memories |"; fi
if [[ $has_feedback -gt 0 ]]; then echo "| Feedback loop | ✓ | ${count_feedback} corrections/confirmations |"; dim_score=$((dim_score+1)); else echo "| Feedback loop | ✗ | no feedback captured |"; fi
if [[ $has_decisions -gt 0 ]]; then echo "| Decisions | ✓ | ${count_decision} decisions recorded |"; dim_score=$((dim_score+1)); else echo "| Decisions | △ | no decisions — are you making choices without recording? |"; fi
if [[ $has_projects -gt 0 ]]; then echo "| Project tracking | ✓ | ${count_project} active projects |"; dim_score=$((dim_score+1)); else echo "| Project tracking | ✗ | no project context |"; fi
if [[ $has_references -gt 0 ]]; then echo "| Knowledge base | ✓ | ${count_reference} references |"; dim_score=$((dim_score+1)); else echo "| Knowledge base | ✗ | no references |"; fi
if [[ $has_claude_rules -gt 0 ]]; then echo "| Rules | ✓ | ${has_claude_rules} rule files |"; dim_score=$((dim_score+1)); else echo "| Rules | ✗ | no rules |"; fi

echo ""
echo "**Coverage score:** ${dim_score}/6 dimensions active"
echo ""

# --- Sibling memory dir symlink health ---
# 2026-04-15 重构后：所有 ~/.claude/projects/*/memory 都应是 symlink → 主仓。
# 这是 memory-symlink-guard.sh 的二层防御 — 若 guard 脚本某次失效，这里会发现。
MAIN_REAL=$(cd "$MEMORY_DIR" 2>/dev/null && pwd -P)
symlink_issues=""
for dir in "$HOME/.claude/projects"/*/memory; do
  [[ "$dir" == "$MEMORY_DIR" ]] && continue
  if [[ -L "$dir" ]]; then
    target_real=$(cd "$dir" 2>/dev/null && pwd -P)
    if [[ "$target_real" != "$MAIN_REAL" ]]; then
      symlink_issues="${symlink_issues}- WRONG SYMLINK TARGET: ${dir}\n"
    fi
  elif [[ -d "$dir" ]]; then
    if [[ -n "$(ls -A "$dir" 2>/dev/null)" ]]; then
      symlink_issues="${symlink_issues}- SIBLING DIR NOT SYMLINK (non-empty): ${dir}\n"
    else
      symlink_issues="${symlink_issues}- SIBLING DIR NOT SYMLINK (empty, guard should converge): ${dir}\n"
    fi
  fi
done

echo "### Issues"
if [[ -n "$issues" ]] || [[ -n "$symlink_issues" ]]; then
  [[ -n "$issues" ]] && printf '%b' "$issues"
  [[ -n "$symlink_issues" ]] && printf '%b' "$symlink_issues"
else
  echo "No issues found."
fi
