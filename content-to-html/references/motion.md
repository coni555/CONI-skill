# 动效与交互节奏

不是菜单——是安全网。从内容节奏出发自由编排，这里只在你对某类动效没把握时帮你确认参数是否健康。

---

## 硬规则

- 每个页面至少包含 3 层动效：入场编排 + scroll reveal + hover 微交互
- 所有动效必须 `prefers-reduced-motion` 降级
- 移动端动效幅度减半，duration 不变
- 同一页面的缓动函数保持一致（选一条主 cubic-bezier 贯穿）

---

## 1. 入场编排（Cover Choreography）

首屏元素逐个显现，制造"幕布拉开"的仪式感。

```css
.cover [data-entrance] {
  opacity: 0;
  transform: translateY(24px);
  animation: entrance 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes entrance {
  to { opacity: 1; transform: translateY(0); }
}
```

**关键参数：**

| 参数 | 健康范围 | 说明 |
|---|---|---|
| 单元素 duration | 0.6s – 1.0s | 短于 0.6 太急，长于 1.0 拖沓 |
| 元素间 delay 间距 | 0.2s – 0.4s | 形成阅读节奏，不是齐刷刷一起出 |
| 位移距离 | 16px – 32px | 太大像弹窗，太小看不出 |
| 缓动 | ease-out 族 | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` 推荐 |

**编排模式：**
- 从上到下：标题 → 副标题 → deck → 元数据（最常用）
- 从中心向外扩散：适合单焦点封面
- 从左到右：适合横排多列布局

---

## 2. Scroll Reveal（滚动显现）

用户滚动到章节时内容"浮现"，而非一次性全部可见。核心机制：IntersectionObserver + CSS 类切换。

```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
```

**关键参数：**

| 参数 | 健康范围 | 说明 |
|---|---|---|
| rootMargin bottom | -8% 到 -15% | 元素进入视口底部 8-15% 时触发 |
| threshold | 0.01 – 0.1 | 露出一点就触发 |
| transition duration | 0.6s – 1.0s | 和入场编排保持一致 |
| 位移距离 | 20px – 40px | 比入场编排稍大（距离远，需要更明显的运动） |

**注意：**
- 这个 observer 和 TOC 高亮的 observer 是**两套独立的**，rootMargin 不同
- `unobserve` 必加——元素只显现一次，不要反复触发
- 给每个 `<section>` 加 `.reveal`，不要给行内元素加

---

## 3. 列表逐条错位（Staggered List Animation）

列表项不一起出现，而是 0.1s 间隔依次浮入。在 scroll reveal 触发后由 JS 驱动。

```javascript
entry.target.querySelectorAll('li, .card, .item').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = `opacity 0.5s ${i * 0.1 + 0.2}s, transform 0.5s ${i * 0.1 + 0.2}s`;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
});
```

**关键参数：**

| 参数 | 健康范围 | 说明 |
|---|---|---|
| 子项 delay 间距 | 0.08s – 0.12s | 太密看不出前后，太稀等太久 |
| 首项基础 delay | 0.15s – 0.3s | 容器先出，子项稍后 |
| 子项位移 | 12px – 20px | 比 section 小——已经在视口内了 |
| 最大延迟上限 | 1.5s | 超过 10 项的列表要 cap delay |

---

## 4. Hover 微交互

鼠标悬停时给出即时反馈，增强可点击感和层次感。

```css
.card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px oklch(0.2 0 0 / 0.12);
}

.interactive-item {
  transition: border-color 0.2s ease, background 0.2s ease;
}
.interactive-item:hover {
  border-color: var(--accent);
  background: oklch(from var(--accent) l c h / 0.06);
}
```

**模式库：**

| 模式 | 适用元素 | 效果 |
|---|---|---|
| 上浮 + 阴影 | 卡片、引用块 | `translateY(-3px ~ -6px)` + 扩散阴影 |
| 边框高亮 | 清单项、选择题 | border-color → accent |
| 背景微亮 | 列表行、TOC 项 | background 加 accent 6-10% opacity |
| 缩放 | 图标、小按钮 | `scale(1.05 ~ 1.1)` |

**关键参数：**

| 参数 | 健康范围 | 说明 |
|---|---|---|
| duration | 0.2s – 0.3s | hover 要即时，不能拖 |
| 上浮距离 | 3px – 6px | 太大像跳起来 |
| 阴影扩散 | 8px – 24px blur | 配合上浮距离 |
| ease 类型 | ease / ease-out | hover 不需要弹性 |

---

## 5. 章节转场装饰（Chapter Transition）

章节之间的视觉呼吸，标记"话题切换了"。

```css
.ch-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--mute), var(--accent), var(--mute), transparent);
  margin: 2rem 0 6rem;
  position: relative;
}
.ch-divider::after {
  content: '';
  position: absolute;
  left: 50%; top: -3px;
  width: 7px; height: 7px;
  background: var(--accent);
  border-radius: 50%;
  transform: translateX(-50%);
}
```

**变体：**
- 渐变线 + 中心圆点（上例，通用）
- 三个圆点 `· · ·`（文学/出版物）
- 编号递增的几何形状（工程/技术）
- 全宽色带（杂志/大标题感）
- 留白 + 章节编号跳变（极简）

---

## 6. 视觉节奏公式

一个页面的动效应该形成**呼吸感**——紧（快速连续）和松（留白等待）交替：

```
Cover 入场 (紧) → 滚动空白 (松) → Ch1 reveal (中) → 内容阅读 (松) 
→ 列表逐条 (紧) → 章节转场 (松) → Ch2 reveal (中) → ...
```

**检查标准：**
- 连续两个"紧"节奏之间至少有一个 section 的自然阅读距离
- 同一视口内同时进行的动画不超过 3 个
- 整页从头滚到尾，动效总时长体感不超过内容阅读时间的 5%

---

## 7. `prefers-reduced-motion` 降级

```css
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  [data-entrance] {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

不是关掉所有动效——是关掉位移和持续动画。`opacity` 渐显可以保留（不引起前庭不适）。
