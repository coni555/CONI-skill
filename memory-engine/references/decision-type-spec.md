# Decision Type Specification

## When to Use

Use `decision` type when the conversation involves choosing between alternatives with explicit tradeoffs. Signals:
- "选了 X 而不是 Y"、"decided to use X instead of Y"
- Comparing pros/cons of different approaches
- Architecture, tool selection, deployment strategy choices
- Any "why this way, not that way" reasoning worth preserving

Do NOT use for:
- Preferences without tradeoffs (those are `feedback`)
- Tool documentation (those are `reference`)
- One-off debugging choices (ephemeral, don't save)

## vs Reference Type

| | reference | decision |
|---|---|---|
| Captures | what-is-true | why-we-chose-this |
| Changes when | facts change | context/constraints change |
| Example | "Lark CLI is configured with personal auth" | "Chose Cloudflare Pages over Vercel for domestic access" |

## Frontmatter Schema

```yaml
---
name: decision-{topic-kebab-case}
description: {one-line: what was chosen and the key reason}
type: decision
chosen: {option picked}
rejected: {option(s) not picked, comma-separated}
---
```

## Body Structure

```markdown
**Context:** {situation that forced the choice — 1-2 sentences}

**Options considered:**
- {Option A}: {key pros/cons}
- {Option B}: {key pros/cons}

**Decision:** {what was chosen and the decisive reason}

**Revisit when:** {conditions that would invalidate this decision}
```

Keep it concise — the whole file should be under 30 lines. The value is in the reasoning, not the detail.

## Example

```yaml
---
name: decision-deploy-cloudflare
description: 国内部署选择 Cloudflare Pages 而非 Vercel — 国内访问稳定性
type: decision
chosen: Cloudflare Pages
rejected: Vercel, Netlify
---
```

```markdown
**Context:** 部署公众号落地页，访问者主要在国内。

**Options considered:**
- Vercel: 开发体验好，但国内访问不稳定
- Cloudflare Pages: 国内直连稳定，Workers 生态，免费额度够

**Decision:** Cloudflare Pages — 国内用户直接访问无需额外 CDN。

**Revisit when:** 目标用户群转向海外，或 Vercel 解决国内访问问题。
```
