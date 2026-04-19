---
name: memory-engine
description: >-
  Enhances the persistent memory system at ~/.claude/projects/-Users-coni/memory/
  with structured save workflows, a "decision" type for architectural tradeoffs,
  token budget tracking per entry, and a health check audit. Triggers on:
  "save memory", "remember this", "记住这个", "/memory-check", "memory health",
  "记忆检查", "记忆健康", "token budget", session-end checkpoint prompts.
  If user mentions saving a decision, tradeoff, or "why X not Y", use this skill.
  Do NOT use for: reading existing memories (MEMORY.md index handles that),
  session restore, or auto-recording tool usage.
user_invocable: true
---

# Memory Engine

Enhancement layer for the manual memory system. This skill does not replace the
existing auto-memory behavior — it adds structure, budget awareness, and a
session-end checkpoint on top of it.

Core philosophy: **suggest, never auto-save**. The human decides what's worth keeping.

## Memory Directory

All memory files live in `~/.claude/projects/-Users-coni/memory/`.
Index file: `MEMORY.md` (always loaded, pure pointers, no content).

## Phase 1: Memory Capture

When saving any memory (whether triggered by you or the session checkpoint),
follow this flow every time:

### Step 1 — Classify

Five types. Pick the one that fits:

| Type | What it captures | Signals |
|------|-----------------|---------|
| `user` | Identity, preferences, values, knowledge | "I'm a...", "I prefer...", personality shifts |
| `feedback` | How to work with the user — corrections AND confirmations | "不要这样", "对就是这样", approach validated |
| `project` | Active work context, deadlines, goals | "We're doing X by Thursday", milestone hit |
| `reference` | External knowledge, tool configs, pointers | New tool discovered, API configured |
| `decision` | Why X was chosen over Y | "选了 X 不选 Y", comparing tradeoffs, architecture calls |

For `decision` type: read `references/decision-type-spec.md` for the frontmatter schema
and body structure (Context → Options → Decision → Revisit When).

### Step 2 — Deduplicate

Before writing, scan MEMORY.md index for overlapping entries:
- Same topic already covered? → **Update** the existing file, don't create a new one
- Overlaps with a CLAUDE.md rule? → Don't save (the rule is authoritative)
- Ephemeral task detail? → Don't save (git log / code is the source of truth)

Apply all rules from `feedback-memory-hygiene.md` — they remain authoritative.

### Step 3 — Estimate Token Cost

Calculate: `file_bytes / 3.2` (integer, rounds down). This gives a reasonable
approximation for mixed CJK/English content without external dependencies.

### Step 4 — Write

1. Create the memory file with YAML frontmatter (name, description, type)
2. Update MEMORY.md index — add entry under the correct section heading
3. Append token estimate: `` `~NNNNtk` `` at end of the index line

Example index line:
```
- [decision-deploy-cloudflare.md](decision-deploy-cloudflare.md) — 国内部署选 CF Pages 非 Vercel `~280tk`
```

### What NOT to Save

These rules are non-negotiable (from memory-hygiene + auto-memory system):
- Code patterns, architecture, file paths — derivable from code
- Git history, recent changes — `git log` is authoritative
- Debug solutions — the fix is in the code
- Anything already in CLAUDE.md or `~/cc-personal/rules/`
- Ephemeral task state — only useful in current session
- Project status snapshots — read from code and git

## Phase 2: Memory Maintenance

### /memory-check

Run the audit script and present results:

```bash
bash ~/.claude/skills/memory-engine/scripts/memory-health-check.sh
```

The script outputs a structured report covering:
- **Budget**: total tokens vs 40,000tk cap (20% of 200K context)
- **Type distribution**: count and tokens per type
- **Top 5 by size**: largest files consuming the most budget
- **Issues**: stale files (>30 days), orphans, broken links, empty types, budget warnings

After presenting the report, suggest specific actions for each issue found:

| Issue | Action |
|-------|--------|
| STALE | "Review or archive: {file} — still relevant?" |
| ORPHAN | "Add to MEMORY.md index, or delete if obsolete" |
| BROKEN LINK | "Remove from MEMORY.md, or recreate the file" |
| NO ENTRIES | Informational — not all types need entries at all times |
| BUDGET WARNING | "Largest files: ... — consider compacting or splitting" |

After resolving issues, update the MEMORY.md budget comment:
```html
<!-- budget: ~NNNNtk / 40000tk (NN%) | updated: YYYY-MM-DD -->
```

### Token Annotation Format

Every MEMORY.md index entry carries a token estimate suffix:
```
- [filename.md](filename.md) — description `~NNNNtk`
```

The budget comment sits at the very top of MEMORY.md (before the heading).
It's an HTML comment — invisible in rendered markdown, parseable by scripts.

## Phase 3: Seven-Dimension Consolidation Checkpoint

### Trigger（双保险）

**主力触发 — Prompt-based（CLAUDE.md 规则）：**
对话中感知到以下信号时，主动执行七维扫描：
- 工具调用密集（>15 次工具调用）
- 完成了一个实质性产出（代码、分析、方案）
- 话题发生了大切换
- 用户明确说"沉淀""复盘""总结"

**兜底触发 — Stop hook（settings.json）：**
`consolidation-trigger.sh` 在每次 agent stop 时运行，追踪 stop 次数和时间间隔。
当 stop 次数 ≥ 20 且距上次触发 ≥ 30 分钟时，输出七维扫描提示。
状态文件：`~/.claude/projects/-Users-coni/memory/.consolidate-state`

### Seven-Dimension Scan

逐条扫描当前对话，判断是否命中：

| # | 维度 | 命中信号 | 对应记忆类型 |
|---|------|----------|-------------|
| 1 | **任务闭环** | 一个完整任务从提出到交付完成 | `project` (里程碑) |
| 2 | **CLAUDE.md 更新** | 发现了新的通用行为规则 | 直接写 CLAUDE.md |
| 3 | **Rules 沉淀** | 发现了领域/工具/文件类型相关的规则 | 写 `~/cc-personal/rules/` |
| 4 | **架构决策** | 做了工具选型、技术方案、部署策略等非显然选择 | `decision` |
| 5 | **项目里程碑** | 项目状态有实质推进（发版、上线、关键功能完成） | `project` |
| 6 | **协作校准** | 用户纠正了做法 或 确认了非显然做法 | `feedback` |
| 7 | **高价值分析** | 产出了可跨会话复用的分析框架、洞察、模型 | `reference` 或 `user` |

### Execution Flow

```
扫描七维 → 统计命中数
  命中 0-1 → 静默跳过
  命中 2+  → 输出 checkpoint 建议
```

### Rules

- Apply the "What NOT to Save" list strictly — no exceptions at checkpoint time
- Check existing MEMORY.md entries before suggesting — no duplicates
- Maximum **3 candidates** per checkpoint — quality over quantity
- If nothing qualifies, output nothing (silent skip, no forced suggestions)
- **Never write files during checkpoint** — only present candidates for user approval
- 每个 candidate 必须标注命中的维度编号

### Output Format

```
[沉淀检查] 本次对话命中 3/7 维度（④⑥⑦），建议沉淀：

1. [decision] ④ 选择 Stop hook + prompt 双触发方案，而非纯 hook — hook 无法感知对话语义
2. [feedback] ⑥ 用户确认：飞轮的核心是自动触发而非记忆分类
3. [reference] ⑦ 主体生命力框架：人/公司/AI 三主体时间精力分配模型

保存哪些？回复编号（如 1,2），或 "skip" 跳过。
```

When user confirms numbers, execute Phase 1 save flow for each selected item.
When user says "skip" or equivalent, do nothing.

## Gotchas

- **Don't update MEMORY.md budget comment on every save** — only during /memory-check.
  Frequent updates break cache and add noise to git diffs.
- **Token estimates are approximations** — don't treat them as exact. The /3.2 method
  is ~90% accurate for mixed CJK/EN content, which is good enough for budget awareness.
- **decision type is for non-trivial choices** — "I used vim instead of nano" is not a
  decision worth saving. Reserve it for choices that affect future sessions.
- **Stop hook 是兜底不是主力** — 如果用户 Ctrl+C 退出，hook 不会触发。主动扫描才是飞轮的引擎。
- **主动扫描不要打断用户的心流** — 在任务间隙（阶段完成、话题切换）触发，不要在执行中途插入。
