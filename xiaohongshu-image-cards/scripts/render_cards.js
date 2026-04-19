#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_WIDTH = 1242;
const DEFAULT_HEIGHT = 1660;
const DEFAULT_FOOTER_LABEL = '';
const DEFAULT_LANG = 'zh-CN';
const DEFAULT_THEME = 'auto';
const VIRTUAL_TIME_BUDGET = 1500;
const POST_JSON_NAME = 'xiaohongshu-post.json';
const POST_MARKDOWN_NAME = '小红书发布文案.md';
const CHROME_SCREENSHOT_TIMEOUT_MS = 30000;

const THEME_CATALOG = {
  editorial: {
    label: '通用干净',
    description: '白底高可读性，适合多数普通图文和没有明显风格倾向的内容。',
    tokens: {
      bodyBg: '#f5f6f8',
      pageBgTop: '#fafbfc',
      pageBgMid: '#ffffff',
      pageBgBottom: '#f6f7fb',
      pageGlowPrimary: 'rgba(255, 77, 79, 0.08)',
      pageGlowSecondary: 'rgba(17, 17, 17, 0.04)',
      textPrimary: '#111111',
      textSecondary: '#2d2f33',
      textMuted: '#6d7178',
      accent: '#ff4d4f',
      accentAlt: '#ff7a45',
      accentSoft: 'rgba(255, 77, 79, 0.10)',
      kickerBg: 'rgba(255, 255, 255, 0.76)',
      line: '#d9dde3',
      lineStrong: '#111111',
      chipBg: '#111111',
      chipText: '#ffffff',
      commandBg: 'rgba(255, 255, 255, 0.92)',
      commandBorder: '#111111',
      commandText: '#111111',
      imageBorder: 'rgba(17, 17, 17, 0.08)',
      shadow: 'rgba(17, 17, 17, 0.12)',
    },
  },
  product: {
    label: '产品案例',
    description: '更理性、更整洁，适合工具介绍、项目展示、产品案例和能力说明。',
    tokens: {
      bodyBg: '#eef4f8',
      pageBgTop: '#f7fbff',
      pageBgMid: '#ffffff',
      pageBgBottom: '#eef5fa',
      pageGlowPrimary: 'rgba(22, 119, 255, 0.14)',
      pageGlowSecondary: 'rgba(37, 194, 245, 0.10)',
      textPrimary: '#0f1720',
      textSecondary: '#2c3a49',
      textMuted: '#607080',
      accent: '#1677ff',
      accentAlt: '#25c2f5',
      accentSoft: 'rgba(22, 119, 255, 0.12)',
      kickerBg: 'rgba(255, 255, 255, 0.82)',
      line: '#d9e2ec',
      lineStrong: '#0f1720',
      chipBg: '#0f1720',
      chipText: '#f5fbff',
      commandBg: 'rgba(255, 255, 255, 0.96)',
      commandBorder: '#1677ff',
      commandText: '#0f1720',
      imageBorder: 'rgba(22, 119, 255, 0.14)',
      shadow: 'rgba(21, 76, 121, 0.15)',
    },
  },
  reflection: {
    label: '情绪反思',
    description: '留白更多、气质更柔和，适合个人感悟、关系、自我观察这类文章。',
    tokens: {
      bodyBg: '#eef5f4',
      pageBgTop: '#f8fbfb',
      pageBgMid: '#ffffff',
      pageBgBottom: '#f1f7f6',
      pageGlowPrimary: 'rgba(45, 143, 133, 0.12)',
      pageGlowSecondary: 'rgba(107, 184, 174, 0.10)',
      textPrimary: '#10201f',
      textSecondary: '#304342',
      textMuted: '#697877',
      accent: '#2d8f85',
      accentAlt: '#6bb8ae',
      accentSoft: 'rgba(45, 143, 133, 0.12)',
      kickerBg: 'rgba(255, 255, 255, 0.84)',
      line: '#d7e2df',
      lineStrong: '#10201f',
      chipBg: '#173937',
      chipText: '#f5fbfa',
      commandBg: 'rgba(255, 255, 255, 0.96)',
      commandBorder: '#2d8f85',
      commandText: '#10201f',
      imageBorder: 'rgba(45, 143, 133, 0.14)',
      shadow: 'rgba(25, 59, 55, 0.14)',
    },
  },
  alert: {
    label: '事故反思',
    description: '对比更强，截图更像证据页，适合异常、风控、事故记录和恢复过程。',
    tokens: {
      bodyBg: '#eef1f5',
      pageBgTop: '#fbfcfd',
      pageBgMid: '#ffffff',
      pageBgBottom: '#eef2f6',
      pageGlowPrimary: 'rgba(255, 77, 79, 0.18)',
      pageGlowSecondary: 'rgba(17, 24, 39, 0.08)',
      textPrimary: '#12151b',
      textSecondary: '#30353f',
      textMuted: '#6a717e',
      accent: '#ff4d4f',
      accentAlt: '#ff7a45',
      accentSoft: 'rgba(255, 77, 79, 0.12)',
      kickerBg: 'rgba(255, 255, 255, 0.86)',
      line: '#d0d7e0',
      lineStrong: '#12151b',
      chipBg: '#16181d',
      chipText: '#ffffff',
      commandBg: 'rgba(22, 24, 31, 0.96)',
      commandBorder: '#ff4d4f',
      commandText: '#ffffff',
      imageBorder: 'rgba(255, 77, 79, 0.20)',
      shadow: 'rgba(17, 24, 39, 0.18)',
    },
  },
  playbook: {
    label: '教程清单',
    description: '步骤感更强，适合教程、清单、方法论、流程拆解和上手指南。',
    tokens: {
      bodyBg: '#eef6f2',
      pageBgTop: '#f8fcfa',
      pageBgMid: '#ffffff',
      pageBgBottom: '#eff8f3',
      pageGlowPrimary: 'rgba(0, 168, 112, 0.14)',
      pageGlowSecondary: 'rgba(91, 207, 155, 0.12)',
      textPrimary: '#0f1f18',
      textSecondary: '#304238',
      textMuted: '#63746a',
      accent: '#00a870',
      accentAlt: '#5bcf9b',
      accentSoft: 'rgba(0, 168, 112, 0.12)',
      kickerBg: 'rgba(255, 255, 255, 0.84)',
      line: '#d6e3dc',
      lineStrong: '#0f1f18',
      chipBg: '#123126',
      chipText: '#f3fcf8',
      commandBg: 'rgba(255, 255, 255, 0.98)',
      commandBorder: '#00a870',
      commandText: '#0f1f18',
      imageBorder: 'rgba(0, 168, 112, 0.16)',
      shadow: 'rgba(15, 63, 44, 0.14)',
    },
  },
};

const THEME_OPTIONS = ['auto', ...Object.keys(THEME_CATALOG)];
const THEME_KEYWORDS = {
  product: [
    '知识库', '文档', '工作流', '产品', '功能', '工具', '项目', '系统', '能力', '方案',
    '开源', '图谱', '聚类', '语义', '连接', '洞察', 'feature', 'case', '交付',
  ],
  reflection: [
    '感悟', '反思', '情绪', '依赖', '脆弱', '焦虑', '成长', '自我', '体会', '害怕',
    '绝望', '温柔', '关系', '失控感', '心里', 'self-compassion', '感情',
  ],
  alert: [
    '异常', '风控', '检测', '可疑', '共享', '限制', '恢复', 'support', '封', '故障',
    '排查', '警告', '提示', '慌', '崩', '账号', '失去', '事故',
  ],
  playbook: [
    '教程', '步骤', '方法', '清单', '流程', '指南', '如何', '怎么做', '建议', '上手',
    '模板', '策略', '第一步', '第二步', '复用', '执行', '命令', '话术',
  ],
};

function parseArgs(argv) {
  const options = {
    input: '',
    output: '',
    footerLabel: '',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--input') {
      options.input = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (token === '--output') {
      options.output = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (token === '--footer-label') {
      options.footerLabel = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }
    fail(`Unknown argument: ${token}`);
  }

  if (!options.input) {
    fail('Missing required --input path.');
  }
  if (!options.output) {
    fail('Missing required --output path.');
  }
  return options;
}

function printHelp() {
  console.log(`Usage:
  node render_cards.js --input /absolute/path/to/cards.json --output /absolute/path/to/output-dir

Optional:
  --footer-label "账号名或栏目名"
`);
}

function fail(message) {
  console.error(`[render_cards] ${message}`);
  process.exit(1);
}

function ensureArray(value, fieldName, pageIndex) {
  if (!Array.isArray(value)) {
    fail(`Page ${pageIndex + 1}: "${fieldName}" must be an array.`);
  }
  return value;
}

function requireString(value, fieldName, pageIndex) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`Page ${pageIndex + 1}: "${fieldName}" must be a non-empty string.`);
  }
  return value;
}

function optionalString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function optionalObject(value, fallback = null) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function normalizeThemeChoice(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_THEME;
  }
  const normalized = value.trim().toLowerCase();
  if (THEME_OPTIONS.includes(normalized)) {
    return normalized;
  }
  fail(`Unsupported theme "${value}". Use one of: ${THEME_OPTIONS.join(', ')}.`);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCssValue(value) {
  return String(value).replace(/"/g, '\\"');
}

function themeCssVariables(themeName) {
  const theme = THEME_CATALOG[themeName] || THEME_CATALOG.editorial;
  return Object.entries(theme.tokens)
    .map(([key, value]) => `--${key}: ${escapeCssValue(value)};`)
    .join(' ');
}

function listThemes() {
  return [
    {
      name: 'auto',
      label: '自动判断',
      description: '根据文章内容自动挑选最匹配的主题，适合大多数情况。',
    },
    ...Object.entries(THEME_CATALOG).map(([name, theme]) => ({
      name,
      label: theme.label,
      description: theme.description,
    })),
  ];
}

function collectSpecText(spec) {
  const parts = [];
  const post = optionalObject(spec.post);
  if (post) {
    parts.push(optionalString(post.title));
    parts.push(optionalString(post.body));
    parts.push(...normalizeStringList(post.titleCandidates));
    parts.push(...normalizeStringList(post.tags));
  }
  const pages = Array.isArray(spec.pages) ? spec.pages : [];
  for (const page of pages) {
    if (!page || typeof page !== 'object') {
      continue;
    }
    for (const value of Object.values(page)) {
      if (typeof value === 'string') {
        parts.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === 'string') {
            parts.push(entry);
          } else if (Array.isArray(entry)) {
            parts.push(entry.join(' '));
          }
        });
      }
    }
  }
  return parts.join('\n').toLowerCase();
}

function collectThemeSignals(text, keywords) {
  return keywords.filter((keyword) => text.includes(keyword));
}

function inferTheme(spec) {
  const text = collectSpecText(spec);
  const pages = Array.isArray(spec.pages) ? spec.pages : [];
  const scores = {
    editorial: 1,
    product: 0,
    reflection: 0,
    alert: 0,
    playbook: 0,
  };
  const signals = {
    product: [],
    reflection: [],
    alert: [],
    playbook: [],
  };

  for (const [themeName, keywords] of Object.entries(THEME_KEYWORDS)) {
    const hits = collectThemeSignals(text, keywords);
    signals[themeName] = hits;
    scores[themeName] += hits.length * 2;
  }

  const pageTypes = pages
    .map((page) => optionalString(page && page.type).toLowerCase())
    .filter(Boolean);
  const imageCount = pageTypes.filter((type) => type === 'image').length;
  const workflowCount = pageTypes.filter((type) => type === 'workflow').length;
  const insightsCount = pageTypes.filter((type) => type === 'insights').length;
  const finalCount = pageTypes.filter((type) => type === 'final').length;

  if (imageCount > 0) {
    scores.alert += imageCount;
    scores.product += Math.min(imageCount, 1);
  }
  if (workflowCount > 0) {
    scores.playbook += workflowCount * 3;
    scores.product += workflowCount;
  }
  if (insightsCount > 0) {
    scores.product += insightsCount * 2;
    scores.playbook += insightsCount;
  }
  if (finalCount > 0) {
    scores.reflection += finalCount;
  }

  if (scores.alert >= 6 && scores.reflection >= 4) {
    scores.alert += 3;
  }
  if (scores.product >= 6 && scores.playbook >= 4) {
    scores.product += 2;
  }

  const rankedThemes = Object.entries(scores)
    .sort((left, right) => right[1] - left[1]);
  const [themeName, score] = rankedThemes[0];
  const runnerUp = rankedThemes[1] || ['editorial', 0];
  const reasons = [];
  if (themeName !== 'editorial' && signals[themeName].length > 0) {
    reasons.push(`文案里出现了 ${signals[themeName].slice(0, 4).join(' / ')} 这类信号。`);
  }
  if (themeName === 'alert' && imageCount > 0) {
    reasons.push('卡片里带有截图或证据页，适合更强对比的事故记录风格。');
  }
  if (themeName === 'product' && (insightsCount > 0 || workflowCount > 0)) {
    reasons.push('内容里有结构化能力点和工作流信息，适合更理性的产品表达。');
  }
  if (themeName === 'reflection' && finalCount > 0) {
    reasons.push('文章收束明显带反思语气，更适合留白感更强的情绪主题。');
  }
  if (themeName === 'playbook' && workflowCount > 0) {
    reasons.push('存在步骤、命令或操作型页面，适合教程清单风格。');
  }
  if (reasons.length === 0) {
    reasons.push('整体信号比较均衡，先回到最稳的通用干净主题。');
  }

  return {
    theme: themeName,
    label: THEME_CATALOG[themeName] ? THEME_CATALOG[themeName].label : '通用干净',
    description: THEME_CATALOG[themeName]
      ? THEME_CATALOG[themeName].description
      : '白底高可读性，适合多数普通图文和没有明显风格倾向的内容。',
    score,
    runnerUp: {
      theme: runnerUp[0],
      label: THEME_CATALOG[runnerUp[0]] ? THEME_CATALOG[runnerUp[0]].label : '通用干净',
      score: runnerUp[1],
    },
    scores,
    reasons,
  };
}

function resolveTheme(spec) {
  const requested = normalizeThemeChoice(spec.meta && spec.meta.theme);
  const inferred = inferTheme(spec);
  const finalTheme = requested === 'auto' ? inferred.theme : requested;
  const theme = THEME_CATALOG[finalTheme] || THEME_CATALOG.editorial;

  return {
    requested,
    source: requested === 'auto' ? 'auto' : 'manual',
    theme: finalTheme,
    label: theme.label,
    description: theme.description,
    tokens: theme.tokens,
    autoTheme: inferred.theme,
    autoLabel: inferred.label,
    autoReasons: inferred.reasons,
    scores: inferred.scores,
  };
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  fail(
    'No supported Chromium browser found. Set CHROME_BIN or install Chrome, Chromium, Edge, or Brave.',
  );
}

function readSpec(inputPath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (error) {
    fail(`Could not parse JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    fail('Spec root must be a JSON object.');
  }

  const meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {};
  const post = optionalObject(parsed.post);
  const pages = parsed.pages;
  if (!Array.isArray(pages) || pages.length === 0) {
    fail('Spec must include a non-empty "pages" array.');
  }

  return {
    meta: {
      width: Number(meta.width) || DEFAULT_WIDTH,
      height: Number(meta.height) || DEFAULT_HEIGHT,
      footerLabel: optionalString(meta.footerLabel, DEFAULT_FOOTER_LABEL),
      lang: optionalString(meta.lang, DEFAULT_LANG),
      theme: normalizeThemeChoice(meta.theme),
    },
    post,
    pages,
  };
}

function normalizePost(post) {
  if (!post) {
    return null;
  }

  const normalized = {
    title: optionalString(post.title),
    titleCandidates: normalizeStringList(post.titleCandidates),
    body: optionalString(post.body),
    tags: normalizeStringList(post.tags),
  };

  if (
    !normalized.title &&
    normalized.titleCandidates.length === 0 &&
    !normalized.body &&
    normalized.tags.length === 0
  ) {
    return null;
  }

  return normalized;
}

function toTagString(tags) {
  return tags
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');
}

function writePostOutputs(post, outputDir) {
  const normalized = normalizePost(post);
  if (!normalized) {
    return;
  }

  const jsonPath = path.join(outputDir, POST_JSON_NAME);
  const markdownPath = path.join(outputDir, POST_MARKDOWN_NAME);
  fs.writeFileSync(jsonPath, `${JSON.stringify(normalized, null, 2)}\n`);

  const sections = ['# 小红书发布文案'];
  if (normalized.title) {
    sections.push(`## 标题\n${normalized.title}`);
  }
  if (normalized.titleCandidates.length > 0) {
    sections.push(
      `## 备选标题\n${normalized.titleCandidates.map((item) => `- ${item}`).join('\n')}`,
    );
  }
  if (normalized.body) {
    sections.push(`## 正文（简短版）\n${normalized.body}`);
  }
  if (normalized.tags.length > 0) {
    sections.push(`## Tags\n${toTagString(normalized.tags)}`);
  }

  fs.writeFileSync(markdownPath, `${sections.join('\n\n')}\n`);
}

function toDataUrlMaybe(imageValue, specDir) {
  if (typeof imageValue !== 'string' || !imageValue.trim()) {
    return '';
  }

  if (
    imageValue.startsWith('data:') ||
    imageValue.startsWith('http://') ||
    imageValue.startsWith('https://')
  ) {
    return imageValue;
  }

  const resolved = path.isAbsolute(imageValue)
    ? imageValue
    : path.resolve(specDir, imageValue);

  if (!fs.existsSync(resolved)) {
    fail(`Image file not found: ${resolved}`);
  }

  const extension = path.extname(resolved).toLowerCase();
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  const mime = mimeMap[extension];
  if (!mime) {
    fail(`Unsupported image extension: ${extension}`);
  }

  return `data:${mime};base64,${fs.readFileSync(resolved).toString('base64')}`;
}

function renderBullets(items, pageIndex) {
  const bulletItems = ensureArray(items, 'bullets', pageIndex);
  return `
    <ul class="bullets">
      ${bulletItems
        .map(
          (item) => `
            <li>
              <span class="dot"></span>
              <span>${escapeHtml(item)}</span>
            </li>`,
        )
        .join('')}
    </ul>`;
}

function renderStandard(page, pageIndex) {
  return `
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1>${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="lede">${escapeHtml(requireString(page.lede, 'lede', pageIndex))}</p>
    ${renderBullets(page.bullets, pageIndex)}
    <div class="quote">${escapeHtml(requireString(page.quote, 'quote', pageIndex))}</div>
  `;
}

function renderCover(page, pageIndex) {
  const chips = ensureArray(page.chips, 'chips', pageIndex);
  return `
    <div class="cover-accent"></div>
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1 class="cover-title">${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="cover-subtitle">${escapeHtml(requireString(page.subtitle, 'subtitle', pageIndex))}</p>
    <div class="chips">
      ${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('')}
    </div>
    ${page.footerNote ? `<div class="cover-footer">${escapeHtml(page.footerNote)}</div>` : ''}
  `;
}

function renderInsights(page, pageIndex) {
  const insights = ensureArray(page.insights, 'insights', pageIndex);
  return `
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1>${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="lede">${escapeHtml(requireString(page.lede, 'lede', pageIndex))}</p>
    <div class="insight-list">
      ${insights
        .map((entry) => {
          if (!Array.isArray(entry) || entry.length !== 2) {
            fail(`Page ${pageIndex + 1}: each "insights" item must be [label, text].`);
          }
          return `
            <div class="insight-item">
              <div class="insight-label">${escapeHtml(entry[0])}</div>
              <div class="insight-text">${escapeHtml(entry[1])}</div>
            </div>`;
        })
        .join('')}
    </div>
  `;
}

function renderImage(page, pageIndex, specDir) {
  return `
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1>${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="lede">${escapeHtml(requireString(page.lede, 'lede', pageIndex))}</p>
    <div class="image-block">
      <img src="${toDataUrlMaybe(requireString(page.image, 'image', pageIndex), specDir)}" alt="card image" />
    </div>
    ${
      page.caption
        ? `<div class="caption">${escapeHtml(optionalString(page.caption))}</div>`
        : ''
    }
    ${renderBullets(page.bullets, pageIndex)}
    <div class="quote">${escapeHtml(requireString(page.quote, 'quote', pageIndex))}</div>
  `;
}

function renderWorkflow(page, pageIndex) {
  return `
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1>${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="lede">${escapeHtml(requireString(page.lede, 'lede', pageIndex))}</p>
    ${renderBullets(page.bullets, pageIndex)}
    <div class="command-label">${escapeHtml(optionalString(page.commandLabel, '你可以直接对 AI 说'))}</div>
    <div class="command">${escapeHtml(requireString(page.command, 'command', pageIndex))}</div>
    <div class="quote">${escapeHtml(requireString(page.quote, 'quote', pageIndex))}</div>
  `;
}

function renderFinal(page, pageIndex) {
  return `
    <div class="kicker">${escapeHtml(requireString(page.kicker, 'kicker', pageIndex))}</div>
    <h1>${escapeHtml(requireString(page.title, 'title', pageIndex)).replace(/\n/g, '<br>')}</h1>
    <p class="lede">${escapeHtml(requireString(page.lede, 'lede', pageIndex))}</p>
    ${renderBullets(page.bullets, pageIndex)}
    <div class="quote">${escapeHtml(requireString(page.quote, 'quote', pageIndex))}</div>
    ${page.footerNote ? `<div class="final-footer">${escapeHtml(page.footerNote)}</div>` : ''}
  `;
}

function renderPageContent(page, pageIndex, specDir) {
  const type = requireString(page.type, 'type', pageIndex);
  if (type === 'cover') return renderCover(page, pageIndex);
  if (type === 'standard') return renderStandard(page, pageIndex);
  if (type === 'insights') return renderInsights(page, pageIndex);
  if (type === 'image') return renderImage(page, pageIndex, specDir);
  if (type === 'workflow') return renderWorkflow(page, pageIndex);
  if (type === 'final') return renderFinal(page, pageIndex);
  fail(`Page ${pageIndex + 1}: unsupported page type "${type}".`);
}

function renderHtml(page, pageIndex, totalPages, meta, specDir, themeInfo) {
  const pageType = requireString(page.type, 'type', pageIndex);
  return `<!doctype html>
<html lang="${escapeHtml(meta.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${meta.width}, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: ${meta.width}px;
        height: ${meta.height}px;
        background: var(--bodyBg);
        color: var(--textPrimary);
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      }
      body {
        position: relative;
        overflow: hidden;
        ${themeCssVariables(themeInfo.theme)}
      }
      .page {
        width: 100%;
        height: 100%;
        padding: 72px 84px 68px;
        background:
          radial-gradient(circle at top right, var(--pageGlowPrimary), transparent 28%),
          radial-gradient(circle at bottom left, var(--pageGlowSecondary), transparent 22%),
          linear-gradient(180deg, var(--pageBgTop) 0%, var(--pageBgMid) 48%, var(--pageBgBottom) 100%);
      }
      .kicker {
        display: inline-block;
        margin-bottom: 26px;
        padding: 10px 18px;
        border: 2px solid var(--accent);
        border-radius: 999px;
        background: var(--kickerBg);
        color: var(--accent);
        font-size: 24px;
        font-weight: 700;
      }
      h1 {
        margin: 0;
        max-width: 980px;
        font-size: 60px;
        line-height: 1.14;
        font-weight: 800;
        color: var(--textPrimary);
      }
      .lede {
        margin: 26px 0 0;
        max-width: 1020px;
        font-size: 34px;
        line-height: 1.6;
        color: var(--textSecondary);
      }
      .bullets {
        margin: 42px 0 0;
        padding: 0;
        list-style: none;
      }
      .bullets li {
        display: flex;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 24px;
        font-size: 30px;
        line-height: 1.7;
        color: var(--textPrimary);
      }
      .dot {
        flex: 0 0 14px;
        width: 14px;
        height: 14px;
        margin-top: 20px;
        border-radius: 999px;
        background: var(--accent);
      }
      .quote {
        margin-top: 34px;
        padding-top: 26px;
        border-top: 2px solid var(--lineStrong);
        font-size: 32px;
        line-height: 1.7;
        font-weight: 700;
        color: var(--textPrimary);
      }
      .footer {
        position: absolute;
        left: 84px;
        right: 84px;
        bottom: 42px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--textMuted);
        font-size: 22px;
      }
      .footer .index {
        color: var(--textPrimary);
        font-weight: 700;
      }
      .cover-accent {
        width: 180px;
        height: 16px;
        margin-bottom: 30px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent), var(--accentAlt));
      }
      .cover-title {
        font-size: 88px;
        line-height: 1.08;
        max-width: 980px;
      }
      .cover-subtitle {
        margin: 40px 0 0;
        max-width: 980px;
        font-size: 36px;
        line-height: 1.72;
        color: var(--textSecondary);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 62px;
      }
      .chips span {
        padding: 16px 24px;
        border-radius: 999px;
        background: var(--chipBg);
        color: var(--chipText);
        font-size: 28px;
        font-weight: 700;
      }
      .cover-footer, .final-footer {
        margin-top: 64px;
        font-size: 30px;
        line-height: 1.7;
        color: var(--textMuted);
      }
      .insight-list {
        margin-top: 42px;
      }
      .insight-item {
        padding: 24px 0;
        border-top: 2px solid var(--line);
      }
      .insight-item:first-child {
        border-top-color: var(--lineStrong);
      }
      .insight-label {
        margin-bottom: 12px;
        color: var(--accent);
        font-size: 32px;
        font-weight: 800;
      }
      .insight-text {
        font-size: 30px;
        line-height: 1.7;
        color: var(--textPrimary);
      }
      .image-block {
        margin-top: 32px;
        display: flex;
        justify-content: center;
      }
      .image-block img {
        max-width: 420px;
        max-height: 560px;
        border-radius: 18px;
        border: 1px solid var(--imageBorder);
        box-shadow: 0 16px 40px var(--shadow);
      }
      .caption {
        margin-top: 20px;
        font-size: 24px;
        line-height: 1.6;
        text-align: center;
        color: var(--textMuted);
      }
      .command-label {
        margin-top: 24px;
        font-size: 24px;
        font-weight: 700;
        color: var(--accent);
      }
      .command {
        margin-top: 14px;
        padding: 24px 28px;
        border: 2px solid var(--commandBorder);
        border-radius: 24px;
        background: var(--commandBg);
        color: var(--commandText);
        font-size: 34px;
        line-height: 1.6;
        font-weight: 700;
      }
      body.theme-product .cover-accent {
        width: 216px;
      }
      body.theme-product .insight-item {
        padding: 28px 0;
      }
      body.theme-reflection .cover-accent {
        width: 140px;
        height: 12px;
      }
      body.theme-reflection .quote {
        border-top-color: var(--line);
      }
      body.theme-alert .quote {
        border-top-color: var(--accent);
        padding-top: 22px;
      }
      body.theme-alert .command {
        background: linear-gradient(180deg, rgba(22, 24, 31, 0.98), rgba(30, 34, 43, 0.98));
      }
      body.theme-alert.page-image .image-block img {
        max-width: 460px;
      }
      body.theme-playbook .dot {
        box-shadow: 0 0 0 8px var(--accentSoft);
      }
      body.theme-playbook .command {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 250, 246, 0.98));
      }
    </style>
  </head>
  <body class="theme-${escapeHtml(themeInfo.theme)} page-${escapeHtml(pageType)}">
    <div class="page">
      ${renderPageContent(page, pageIndex, specDir)}
    </div>
    <div class="footer">
      <span>${escapeHtml(meta.footerLabel)}</span>
      <span class="index">${String(pageIndex + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</span>
    </div>
  </body>
</html>`;
}

function findPlaywrightModulePath() {
  const explicitPaths = [
    process.cwd(),
    __dirname,
    path.resolve(__dirname, '..'),
    os.homedir(),
  ];

  for (const basePath of explicitPaths) {
    try {
      return require.resolve('playwright', { paths: [basePath] });
    } catch (_) {
      // Keep looking; Playwright is optional.
    }
  }

  const npxCacheDir = path.join(os.homedir(), '.npm', '_npx');
  try {
    const candidates = fs
      .readdirSync(npxCacheDir)
      .map((entry) => path.join(npxCacheDir, entry, 'node_modules', 'playwright'))
      .filter((candidate) => fs.existsSync(candidate));

    for (const candidate of candidates) {
      try {
        return require.resolve(candidate);
      } catch (_) {
        // Ignore malformed cache entries.
      }
    }
  } catch (_) {
    // No npx cache or not readable.
  }

  return '';
}

function screenshotWithPlaywright(htmlPath, pngPath, meta, chrome) {
  const playwrightPath = findPlaywrightModulePath();
  if (!playwrightPath) {
    return false;
  }

  const script = `
    const { chromium } = require(process.argv[1]);
    const htmlPath = process.argv[2];
    const pngPath = process.argv[3];
    const width = Number(process.argv[4]);
    const height = Number(process.argv[5]);
    const executablePath = process.argv[6];

    (async () => {
      const browser = await chromium.launch({ executablePath, headless: true });
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
      await page.screenshot({ path: pngPath, fullPage: false });
      await browser.close();
    })().catch((error) => {
      console.error(error && error.stack ? error.stack : String(error));
      process.exit(1);
    });
  `;

  execFileSync(
    process.execPath,
    ['-e', script, playwrightPath, htmlPath, pngPath, String(meta.width), String(meta.height), chrome],
    { stdio: 'pipe', timeout: CHROME_SCREENSHOT_TIMEOUT_MS },
  );
  return true;
}

function screenshotWithChromeCli(htmlPath, pngPath, meta, chrome) {
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${meta.width},${meta.height}`,
      `--virtual-time-budget=${VIRTUAL_TIME_BUDGET}`,
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'pipe', timeout: CHROME_SCREENSHOT_TIMEOUT_MS },
  );
}

function screenshotPage(htmlPath, pngPath, meta, chrome) {
  try {
    if (screenshotWithPlaywright(htmlPath, pngPath, meta, chrome)) {
      return;
    }
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.warn(`[render_cards] Playwright screenshot failed; falling back to Chrome CLI. ${message}`);
  }

  screenshotWithChromeCli(htmlPath, pngPath, meta, chrome);
}

function renderAll(specPath, outputDir, footerOverride) {
  const chrome = findChromeBinary();
  const resolvedSpecPath = path.resolve(specPath);
  const resolvedOutputDir = path.resolve(outputDir);
  const specDir = path.dirname(resolvedSpecPath);
  const { meta, post, pages } = readSpec(resolvedSpecPath);
  const themeInfo = resolveTheme({ meta, post, pages });
  const mergedMeta = {
    ...meta,
    footerLabel: footerOverride || meta.footerLabel,
  };

  const sourceDir = path.join(resolvedOutputDir, 'source');
  fs.mkdirSync(sourceDir, { recursive: true });

  pages.forEach((page, index) => {
    const html = renderHtml(page, index, pages.length, mergedMeta, specDir, themeInfo);
    const htmlName = `${String(index + 1).padStart(2, '0')}.html`;
    const pngName = `${String(index + 1).padStart(2, '0')}.png`;
    const htmlPath = path.join(sourceDir, htmlName);
    const pngPath = path.join(resolvedOutputDir, pngName);

    fs.writeFileSync(htmlPath, html);
    screenshotPage(htmlPath, pngPath, mergedMeta, chrome);
  });

  writePostOutputs(post, resolvedOutputDir);
  const modeLabel = themeInfo.source === 'auto' ? 'auto' : 'manual';
  console.log(
    `Rendered ${pages.length} page(s) to ${resolvedOutputDir} | theme: ${themeInfo.theme} (${themeInfo.label}, ${modeLabel})`,
  );
}

function main() {
  const args = parseArgs(process.argv);
  renderAll(args.input, args.output, args.footerLabel);
}

if (require.main === module) {
  main();
}

module.exports = {
  findChromeBinary,
  inferTheme,
  listThemes,
  readSpec,
  resolveTheme,
  normalizeThemeChoice,
  renderAll,
};
