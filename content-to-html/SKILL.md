---
name: content-to-html
description: 把中长文内容(逐字稿/会议记录/播客/演讲/文章,>5000字)反向工程为沉浸式单 HTML 深度阅读页。每次产出设计语言完全不同,基础设施层(TOC/responsive/Observer)由骨架保障不漏。触发词："做成网页"、"提炼要点"、"帮我吸收"、"做成可读页"、"整理成阅读体验"、"帮我看完"、"summarize as a webpage"——任何"读完长文+以阅读形式吸收"的意图。文件类型 .md/.txt/.doc/.docx/.pdf/.srt/.vtt 都接。Do NOT use for: 短笔记(<3000字)、纯代码、只要 markdown(无展示意图)、纯前端组件(用 frontend-design)、格式直转(.md→.html)。
---

# Content → Immersive HTML

产出不是"会议纪要的 HTML 版"。产出是**一份可以钉在墙上、隔三个月再读还能榨出价值的深度阅读体验**。

三条核心原则，按优先级排列：

1. **大胆发挥。** 从内容气质出发，自由创造——形制、色板、字体、动效、交互，全部由你对内容的理解驱动，不受任何预设菜单约束。references/ 下的所有文件都是**验你没信心时才打开的安全网**，不是点菜单。想到一个从没出现过的形制？做。觉得内容适合一个完全反常规的配色？用。唯一的禁区是 AI slop（见 checklist.md P0）。

2. **反向工程，不是复述。** 把口语方法论/洞察/金句反向工程为可复用的工作框架——抽骨架、删口水、压清单、留金句、加自检。读者读完应该觉得"原文我可以不读了"。

3. **基础设施保底。** 创意自由不代表基建可以漏。TOC/responsive/Observer/CSS变量/进度条/scroll reveal——这些由 `assets/skeleton.html` 保障存在。表现层随你发挥，基础设施层不能缺。

---

## Step 1 · 读完全文

| 文件类型 | 读取方式 |
|---|---|
| `.md` / `.txt` | Read tool 直读 |
| `.doc` / `.docx` | `python3 -c "from docx import Document; ..."` 提取 |
| `.pdf` | Read tool + `pages` 参数分页 |
| `.srt` / `.vtt` | sed/awk 去时间戳 |

超过 30k 字分段读。**读不完就敢开写 = 跑偏。**

---

## Step 2 · 需求澄清（动手前必做）

用户给了完整素材但没说清意图时，逐项对齐：

| # | 问题 | 为什么问 |
|---|---|---|
| 1 | **内容的核心冲突/反差是什么？** | 确认你理解对了方向 |
| 2 | **读者是谁？** | 深度/术语/比喻的选择依据 |
| 3 | **有无偏好的形制方向？** | 用户有主意就别猜 |
| 4 | **哪 2-3 个章节最重要？** | 资源分配：重要章节配交互/大视觉 |
| 5 | **有无必须保留的原文金句？** | 不被"反向工程"误删 |

用户已给充分上下文 → 跳过直接进 Step 3。

---

## Step 3 · 提炼骨架

压成 5-8 个章节。每个章节给三个东西：
- **核心论点**（一句话）
- **关键证据**（原文最有力的例子/金句）
- **落地动作**（读者读完能做什么）

**给用户一行预览**："提炼了 7 个模块：① …② …③ …，主要聚焦 ③。"等确认后再写代码。

---

## Step 4 · 扫已有产物 + 选定设计语言

```bash
ls ~/Downloads/*.html 2>/dev/null | head -20
```

快速过已有页的色板/字体，避免无意识重复（不是强制对立——如果内容确实适合相似方向，那就相似）。

写代码**前**明确五件事。全部从**内容本身**推导，自由发挥。references 只在你对某个维度没把握时才打开验证：

| 维度 | 做法 | 没把握时参考 |
|---|---|---|
| **形制** | 从内容气质出发自由创造，给它一个具体名字（不要"现代极简"） | `references/forms.md` |
| **色板** | 从内容情绪推导色相，OKLCH 配色，确保 L 差 ≥ 0.4 | `references/palettes.md` |
| **字体** | 配合形制选中英对仗，禁用 Inter/Roboto/Arial | `references/typography.md` |
| **视觉签名** | 从形制长出 1-3 个独特装饰元素，这是记忆点 | 自由发挥 |
| **核心交互** | 从内容里的比喻/反差/公式推导，必须改变信息展示 | `references/interactions.md` |
| **动效节奏** | 入场编排 + scroll reveal + hover 微交互 + 章节转场 | `references/motion.md` |

---

## Step 5 · 写代码

**开始写代码前，读一遍 `~/.claude/skills/frontend-design/SKILL.md`**——它提供通用美学执行原则（动效优先级、空间构图、背景质感、视觉记忆点），作为本 skill 内容层指导的补充。两者叠加使用：content-to-html 管"做什么内容、什么结构"，frontend-design 管"怎么做得好看、有记忆点"。

**单 HTML 自包含**。参考 `assets/skeleton.html` 确保基础设施不漏：

必备基础设施（骨架已预置，每次确认存在）：
- CSS 变量管理 token（`--paper`, `--ink`, `--accent` 等）
- 常驻 TOC 导航 + IntersectionObserver 实时高亮
- 响应式（至少一档 `@media (max-width: 880px)`）
- 进度条 + 平滑滚动
- Scroll reveal + 入场编排 + hover 微交互（三层动效最低配）
- `prefers-reduced-motion` 降级
- Google Fonts `<link>` 加载

表现层（每次不同）：
- 形制决定 TOC 的形态（左侧栏 / 右侧 spine / 顶部 tab / 圆形 dock / 抽屉）
- 形制决定展开策略（始终展开 / hover 展开 / 滚动浮现 / 只显示圆点）
- 小屏一律折叠，不强占主内容视野

**代码长度**：800-1500 行。短于 800 没嚼透，长于 1500 在堆装饰。

### 标准结构

```
[TOC]              常驻导航（必备 · 形制一致 · Observer 高亮）
[Cover]            期刊封面感（标题 + deck + 元数据 + 视觉签名）
[5-8 Chapters]     每章：编号 + 标题 + deck + 主体 + 图示/对比/卡片
[1+ Interactive]   至少 1 个真有用的交互
[Self-check]       5-10 条自检清单
[Coda]             一句金句 + 出处
[Colophon]         字体/设计说明/致读者
```

---

## Step 6 · 自检

运行校验脚本：

```bash
node ~/.claude/skills/content-to-html/scripts/validate-page.mjs ~/Downloads/<filename>.html
```

同时人工对照 `references/checklist.md` 的 P0 项。**P0 未过不交付。**

---

## Step 7 · 输出 + 打开

```bash
# 文件名有描述性
open ~/Downloads/<descriptive-slug>.html
```

---

## Step 8 · 收尾说明

给用户简短回顾：
- 选了什么形制（为什么）
- 提炼了几个模块
- 哪个交互最值得反复用
- 跟之前产物的差异

---

## 内容反向工程动作

| 动作 | 解释 |
|---|---|
| **删口水** | 嗯/啊/那个/扣个一/听懂了吗——全删 |
| **保金句** | 原文最狠最准的那句，原话保留做 pull-quote |
| **拆颗粒** | 一段 800 字口语通常藏 3-5 个独立论点——拆开 |
| **造对照** | before/after、反例/正例——对开做 |
| **抽公式** | 反复用的判断标准压成一行公式 |
| **加自检** | 读者下次该怎么用，压成 5-8 条 checklist |
| **找比喻** | 全篇最有力的比喻，围绕它做交互或图示 |

---

## 必须避开的 AI slop

任何一条命中就改稿。完整清单见 `references/checklist.md`。

关键 P0（必杀）：
- 紫色渐变白底
- Inter / Roboto / Arial
- Hero + 三栏 + CTA + footer 落地页结构
- 无视觉签名的"干净"
- 口语直搬（违反反向工程）
- TOC 缺失或不高亮
- 无响应式断点
