# Page Spec

Use a single JSON file with this top-level shape:

```json
{
  "meta": {
    "width": 1242,
    "height": 1660,
    "footerLabel": "",
    "lang": "zh-CN",
    "theme": "auto"
  },
  "post": {
    "title": "最终发布标题",
    "titleCandidates": ["备选标题 1", "备选标题 2"],
    "body": "小红书正文，默认 200-300 个中文字符。",
    "tags": ["AI", "ChatGPT", "小红书图文"]
  },
  "pages": []
}
```

`meta` is optional. The renderer defaults to `1242x1660`, no footer label, `zh-CN`, and `theme: "auto"`.
`post` is optional, but strongly recommended. If present, the renderer also exports:

- `xiaohongshu-post.json`
- `小红书发布文案.md`

## Theme selection

`meta.theme` supports:

- `auto`: let the renderer infer the best theme from the article content
- `editorial`: clean default style
- `product`: product / tool / project case-study style
- `reflection`: softer personal reflection style
- `alert`: stronger incident / warning / recovery style
- `playbook`: tutorial / checklist / workflow style

Recommended rule:

- Start with `auto`.
- Only force a theme when you already know the desired tone.
- If the auto choice feels close but not exact, edit the card copy first, then decide whether to override.

## Post metadata

```json
{
  "post": {
    "title": "我只是切了个谷歌账户，GPT 却判我账号共享",
    "titleCandidates": [
      "GPT 把我判成账号共享之后，我才发现自己有多依赖它",
      "一次异常活动检测，把我从降智拉进风控"
    ],
    "body": "记录一次 GPT 账号被判异常活动后的完整经历：从功能异常、被风控，到最后恢复正常，也顺便看清了自己对这个账号的依赖。",
    "tags": ["ChatGPT", "AI工具", "账号风控", "自我觉察"]
  }
}
```

Guidelines:

- `title`: final recommended title.
- `titleCandidates`: optional alternates for AB testing.
- `body`: Xiaohongshu正文，默认写成 200-300 个中文字符。内容应包含开头钩子、核心观点、简短展开和一个柔和的互动/反思收束；只有用户明确要求短文案时才压缩到 2-4 句。
- `tags`: write plain tag text without `#`; export will add `#` automatically.

## Supported page types

### `cover`

```json
{
  "type": "cover",
  "kicker": "飞书知识库 / AI",
  "title": "我给飞书知识库\n补了一层 AI 大脑",
  "subtitle": "一句更完整的副标题。",
  "chips": ["语义连接", "知识体检", "碰撞洞察"],
  "footerNote": "可选；不需要就省略。只放读者需要看的内容，不放来源、生成过程或草稿说明。"
}
```

Use for the first page only.

### `standard`

```json
{
  "type": "standard",
  "kicker": "01 / 问题",
  "title": "文档越写越多，\n关系却越来越看不见",
  "lede": "1-3 句导语。",
  "bullets": ["要点一", "要点二", "要点三"],
  "quote": "一句收束或反转。"
}
```

Default body card. Use for most pages.

### `insights`

```json
{
  "type": "insights",
  "kicker": "03 / 价值",
  "title": "不只是画图谱，\n而是告诉你哪里值得动手",
  "lede": "一句总领。",
  "insights": [
    ["枢纽文档", "描述"],
    ["孤岛文档", "描述"]
  ]
}
```

Use when the content is a list of named concepts.

### `image`

```json
{
  "type": "image",
  "kicker": "04 / 洞察",
  "title": "AI 还会自动聚类",
  "lede": "一句解释。",
  "image": "/absolute/path/to/image.png",
  "caption": "图注，可选。",
  "bullets": ["图后的要点一", "图后的要点二"],
  "quote": "图页收束句。"
}
```

`image` accepts:

- absolute local path
- relative path resolved from the JSON file directory
- `data:` URL
- `http(s)` URL

### `workflow`

```json
{
  "type": "workflow",
  "kicker": "06 / 工作流",
  "title": "它不是 demo",
  "lede": "一句总领。",
  "bullets": ["触发话术一", "触发话术二"],
  "commandLabel": "你可以直接对 AI 说",
  "command": "帮我分析一下产品空间里我自己写的文档",
  "quote": "最后一句。"
}
```

Use when there is a natural-language prompt or a memorable callout.

### `final`

```json
{
  "type": "final",
  "kicker": "07 / 为什么做",
  "title": "这不是为了比赛才出现的想法",
  "lede": "结尾导语。",
  "bullets": ["结尾点一", "结尾点二"],
  "quote": "结尾 CTA。",
  "footerNote": "可选。只放读者需要看的内容，不放来源、生成过程或草稿说明。"
}
```

Use for the closing page.

## Heuristics

- Prefer 6-9 pages unless the user clearly wants fewer or more.
- Keep titles under roughly 18-22 Chinese characters per line.
- If a page uses 4 bullets, keep the lede short.
- If a page has an image, keep the bullet list shorter than a pure text page.
- Delete internal notes before final render.
- Prefer 3-6 tags, not a tag wall.
- Keep the post body shorter than the article; it should feel like a caption, not a second essay.
