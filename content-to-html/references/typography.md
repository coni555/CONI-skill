# 字体组合

全部从 Google Fonts 加载。每次至少换 display 字体，中文也尽量翻转（serif ↔ sans）。

---

## 预设组合

| # | 场景 | 中文 | 英文 display | 英文 body | mono |
|---|---|---|---|---|---|
| 1 | 文学出版物 | Noto Serif SC | Newsreader | Noto Serif | JetBrains Mono |
| 2 | 工程蓝图 | Noto Sans SC | Bricolage Grotesque | Inter Tight | JetBrains Mono |
| 3 | 广告策略书 | Noto Serif SC | Fraunces | DM Sans | DM Mono |
| 4 | 学术教材 | LXGW WenKai | EB Garamond | Source Sans 3 | IBM Plex Mono |
| 5 | 极简日式 | Noto Sans SC | Cormorant | DM Sans | Space Mono |
| 6 | 美术馆 catalog | Noto Serif SC | Playfair Display | Lora | Space Mono |
| 7 | 瑞士国际主义 | Noto Sans SC | Inter Tight | Inter | JetBrains Mono |
| 8 | 暗金沉浸 | LXGW WenKai | Cormorant Garamond | Lora | Fira Code |

---

## 对仗原则

| 规则 | 原因 |
|---|---|
| 中文衬线 ↔ 英文衬线 display | 气质统一 |
| 中文黑体 ↔ 英文无衬线 display | 同上 |
| body 比 display 更收敛 | 不抢视线 |
| mono 用于元数据/编号/代码 | 功能清晰 |
| 同一份里最多 4 个家族 | 超过就花 |

---

## 禁止名单

以下字体不得出现（AI 默认选择 / 辨识度为零）：

- Inter（除非用于瑞士国际主义形制 body）
- Roboto
- Arial
- Open Sans
- Poppins
- Montserrat

---

## 加载模板

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=字体1&family=字体2&display=swap" rel="stylesheet">
```

始终加 `preconnect` 和 `display=swap`。
