#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { execFile, execFileSync } = require('child_process');
const { listThemes, resolveTheme } = require('./render_cards.js');

function fail(message) {
  console.error(`[edit_cards] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    input: '',
    output: '',
    port: 0,
    open: false,
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
    if (token === '--port') {
      options.port = Number(argv[index + 1] || 0);
      index += 1;
      continue;
    }
    if (token === '--open') {
      options.open = true;
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
  return options;
}

function printHelp() {
  console.log(`Usage:
  node edit_cards.js --input /absolute/path/to/cards.json [--output /absolute/path/to/output-dir] [--port 4835] [--open]

Notes:
  - If --output is omitted, the editor uses the JSON file directory.
  - Click "保存并重新渲染" in the browser to update PNG previews and post copy exports.
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      resolve(raw);
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(`${JSON.stringify(payload)}\n`);
}

function sendText(res, statusCode, content, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(content);
}

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, 'Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.html': 'text/html; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };
  res.writeHead(200, {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(filePath).pipe(res);
}

function getPreviewFiles(outputDir) {
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  return fs
    .readdirSync(outputDir)
    .filter((name) => /^\d+\.png$/i.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function maybeOpenBrowser(url) {
  const openCommand = process.platform === 'darwin' ? 'open' : 'xdg-open';
  execFile(openCommand, [url], () => {});
}

function createHtml(config) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>小红书图文编辑器</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        color: #111111;
        background: #f5f6f8;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
        min-height: 100vh;
      }
      .editor-pane {
        padding: 24px;
      }
      .preview-pane {
        border-left: 1px solid #d9dde3;
        background: #ffffff;
        padding: 24px;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow: auto;
      }
      .topbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .title-block h1 {
        margin: 0 0 6px;
        font-size: 28px;
        line-height: 1.2;
      }
      .title-block p {
        margin: 0;
        color: #5b6068;
        font-size: 14px;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      button {
        border: 1px solid #111111;
        background: #ffffff;
        color: #111111;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      button.primary {
        background: #111111;
        color: #ffffff;
      }
      button.danger {
        border-color: #ff4d4f;
        color: #ff4d4f;
      }
      .status {
        margin-bottom: 20px;
        padding: 12px 14px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #d9dde3;
        color: #2d2f33;
        font-size: 14px;
      }
      .section {
        margin-bottom: 20px;
        padding: 18px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #d9dde3;
      }
      .section h2 {
        margin: 0 0 12px;
        font-size: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }
      .field label {
        font-size: 13px;
        font-weight: 700;
        color: #5b6068;
      }
      input, textarea, select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c9ced6;
        border-radius: 8px;
        background: #ffffff;
        color: #111111;
        font: inherit;
      }
      textarea {
        min-height: 96px;
        resize: vertical;
        line-height: 1.6;
      }
      .page-card {
        margin-bottom: 18px;
        padding: 18px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #d9dde3;
      }
      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .page-head strong {
        font-size: 18px;
      }
      .page-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .hint {
        color: #6d7178;
        font-size: 12px;
        line-height: 1.5;
      }
      .preview-grid {
        display: grid;
        gap: 16px;
      }
      .preview-item img {
        width: 100%;
        display: block;
        border-radius: 8px;
        border: 1px solid #d9dde3;
        background: #f5f6f8;
      }
      .preview-label {
        margin-bottom: 6px;
        font-size: 13px;
        color: #5b6068;
        font-weight: 700;
      }
      .output-box {
        margin-bottom: 18px;
        padding: 14px;
        border-radius: 8px;
        background: #f8f9fb;
        border: 1px solid #d9dde3;
        font-size: 13px;
        line-height: 1.5;
        word-break: break-all;
      }
      .caption-preview {
        margin-top: 12px;
        padding: 14px;
        border-radius: 8px;
        background: #f8f9fb;
        border: 1px solid #d9dde3;
        white-space: pre-wrap;
        line-height: 1.7;
      }
      .theme-preview {
        margin-top: 12px;
        padding: 14px;
        border-radius: 8px;
        background: #f8f9fb;
        border: 1px solid #d9dde3;
        line-height: 1.7;
      }
      .theme-preview strong {
        display: block;
        margin-bottom: 6px;
      }
      .theme-preview .meta {
        color: #5b6068;
        font-size: 13px;
      }
      .theme-preview ul {
        margin: 10px 0 0;
        padding-left: 18px;
      }
      @media (max-width: 1200px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .preview-pane {
          position: static;
          height: auto;
          border-left: 0;
          border-top: 1px solid #d9dde3;
        }
      }
      @media (max-width: 720px) {
        .editor-pane, .preview-pane {
          padding: 16px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <main class="editor-pane">
        <div class="topbar">
          <div class="title-block">
            <h1>小红书图文编辑器</h1>
            <p>直接改卡片、发布标题、短正文、tags 和主题风格，保存后可一键重渲染。</p>
          </div>
          <div class="actions">
            <button id="saveButton">保存 JSON</button>
            <button id="renderButton" class="primary">保存并重新渲染</button>
            <button id="reloadButton">重新读取文件</button>
          </div>
        </div>

        <div id="status" class="status">正在读取数据...</div>

        <section class="section">
          <h2>样式主题</h2>
          <div class="grid">
            <div class="field">
              <label for="metaTheme">主题选择</label>
              <select id="metaTheme"></select>
            </div>
            <div class="field">
              <label for="metaFooterLabel">底部标签</label>
              <input id="metaFooterLabel" type="text" />
            </div>
          </div>
          <div class="hint">可以手动锁定主题，也可以让系统按文章内容自动判断。自动模式会把判断理由展示在下面。</div>
          <div id="themePreview" class="theme-preview"></div>
        </section>

        <section class="section">
          <h2>发布文案</h2>
          <div class="grid">
            <div class="field">
              <label for="postTitle">最终标题</label>
              <textarea id="postTitle"></textarea>
            </div>
            <div class="field">
              <label for="postTitleCandidates">备选标题（每行一个）</label>
              <textarea id="postTitleCandidates"></textarea>
            </div>
          </div>
          <div class="field">
            <label for="postBody">小红书正文（简短版）</label>
            <textarea id="postBody"></textarea>
          </div>
          <div class="field">
            <label for="postTags">Tags（支持换行或逗号分隔）</label>
            <textarea id="postTags"></textarea>
          </div>
          <div class="hint">渲染后会额外导出 <code>xiaohongshu-post.json</code> 和 <code>小红书发布文案.md</code>。</div>
          <div id="captionPreview" class="caption-preview"></div>
        </section>

        <section class="section">
          <h2>页面</h2>
          <div class="actions" style="margin-bottom: 14px;">
            <button id="addStandardPage">新增标准页</button>
            <button id="addImagePage">新增图片页</button>
            <button id="addFinalPage">新增结尾页</button>
          </div>
          <div id="pages"></div>
        </section>
      </main>

      <aside class="preview-pane">
        <div class="topbar" style="margin-bottom: 16px;">
          <div class="title-block">
            <h1 style="font-size: 22px;">渲染预览</h1>
            <p>最新 PNG 会出现在这里。</p>
          </div>
          <div class="actions">
            <button id="refreshPreviewButton">刷新预览</button>
          </div>
        </div>
        <div class="output-box">
          <div><strong>JSON:</strong> ${escapeHtmlForHtml(config.inputPath)}</div>
          <div><strong>输出目录:</strong> ${escapeHtmlForHtml(config.outputDir)}</div>
        </div>
        <div id="previewGrid" class="preview-grid"></div>
      </aside>
    </div>

    <script>
      const themeCatalog = ${JSON.stringify(config.themes)};
      const state = {
        spec: null,
        lastPreviewStamp: Date.now(),
        themePreview: null,
      };

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function toLines(value) {
        return Array.isArray(value) ? value.join('\\n') : '';
      }

      function toInsightsLines(value) {
        if (!Array.isArray(value)) {
          return '';
        }
        return value.map((item) => Array.isArray(item) ? item.join(' | ') : '').filter(Boolean).join('\\n');
      }

      function linesToArray(text) {
        return text
          .split(/\\n+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      function textToTagArray(text) {
        return text
          .split(/[\\n,，]+/)
          .map((item) => item.trim().replace(/^#/, ''))
          .filter(Boolean);
      }

      function textToInsights(text) {
        return linesToArray(text)
          .map((line) => {
            const pipeIndex = line.indexOf('|');
            if (pipeIndex === -1) {
              return [line.trim(), ''];
            }
            return [line.slice(0, pipeIndex).trim(), line.slice(pipeIndex + 1).trim()];
          })
          .filter(([label, body]) => label || body);
      }

      function defaultPage(type) {
        if (type === 'cover') {
          return {
            type: 'cover',
            kicker: '',
            title: '',
            subtitle: '',
            chips: []
          };
        }
        if (type === 'insights') {
          return {
            type: 'insights',
            kicker: '',
            title: '',
            lede: '',
            insights: []
          };
        }
        if (type === 'image') {
          return {
            type: 'image',
            kicker: '',
            title: '',
            lede: '',
            image: '',
            caption: '',
            bullets: [],
            quote: ''
          };
        }
        if (type === 'workflow') {
          return {
            type: 'workflow',
            kicker: '',
            title: '',
            lede: '',
            bullets: [],
            commandLabel: '你可以直接对 AI 说',
            command: '',
            quote: ''
          };
        }
        if (type === 'final') {
          return {
            type: 'final',
            kicker: '',
            title: '',
            lede: '',
            bullets: [],
            quote: '',
            footerNote: ''
          };
        }
        return {
          type: 'standard',
          kicker: '',
          title: '',
          lede: '',
          bullets: [],
          quote: ''
        };
      }

      function mergePageForType(currentPage, nextType) {
        const nextPage = defaultPage(nextType);
        const carryKeys = ['kicker', 'title', 'lede', 'quote', 'subtitle', 'caption', 'image', 'commandLabel', 'command', 'footerNote'];
        for (const key of carryKeys) {
          if (typeof currentPage[key] === 'string' && key in nextPage) {
            nextPage[key] = currentPage[key];
          }
        }
        if (Array.isArray(currentPage.bullets) && Array.isArray(nextPage.bullets)) {
          nextPage.bullets = currentPage.bullets.slice();
        }
        if (Array.isArray(currentPage.chips) && Array.isArray(nextPage.chips)) {
          nextPage.chips = currentPage.chips.slice();
        }
        if (Array.isArray(currentPage.insights) && Array.isArray(nextPage.insights)) {
          nextPage.insights = currentPage.insights.slice();
        }
        return nextPage;
      }

      function ensurePost() {
        if (!state.spec.post || typeof state.spec.post !== 'object' || Array.isArray(state.spec.post)) {
          state.spec.post = {};
        }
      }

      function ensureMeta() {
        if (!state.spec.meta || typeof state.spec.meta !== 'object' || Array.isArray(state.spec.meta)) {
          state.spec.meta = {};
        }
        if (!state.spec.meta.theme) {
          state.spec.meta.theme = 'auto';
        }
      }

      function renderThemePreview(payload) {
        state.themePreview = payload;
        const node = document.getElementById('themePreview');
        if (!payload) {
          node.innerHTML = '还没有主题信息。';
          return;
        }
        const lines = [];
        lines.push('<strong>当前将使用：' + escapeHtml(payload.label) + '</strong>');
        if (payload.source === 'auto') {
          lines.push('<div class="meta">自动判断 · ' + escapeHtml(payload.theme) + '</div>');
        } else {
          lines.push(
            '<div class="meta">手动锁定 · 当前 ' + escapeHtml(payload.label) +
            '；自动推荐 ' + escapeHtml(payload.autoLabel) + '</div>'
          );
        }
        lines.push('<div>' + escapeHtml(payload.description) + '</div>');
        if (Array.isArray(payload.autoReasons) && payload.autoReasons.length > 0) {
          lines.push(
            '<ul>' +
            payload.autoReasons.map((reason) => '<li>' + escapeHtml(reason) + '</li>').join('') +
            '</ul>'
          );
        }
        node.innerHTML = lines.join('');
      }

      async function refreshThemePreview() {
        ensureMeta();
        const payload = await fetchJson('/api/theme-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.spec)
        });
        renderThemePreview(payload.theme);
      }

      let themePreviewTimer = null;

      function scheduleThemePreview() {
        window.clearTimeout(themePreviewTimer);
        themePreviewTimer = window.setTimeout(() => {
          refreshThemePreview().catch((error) => {
            setStatus(error.message, 'error');
          });
        }, 200);
      }

      function renderMetaSection() {
        ensureMeta();
        const themeSelect = document.getElementById('metaTheme');
        themeSelect.innerHTML = themeCatalog.map((theme) => {
          return '<option value="' + escapeHtml(theme.name) + '">' + escapeHtml(theme.label) + '</option>';
        }).join('');
        themeSelect.value = state.spec.meta.theme || 'auto';
        document.getElementById('metaFooterLabel').value = state.spec.meta.footerLabel || '';

        themeSelect.onchange = (event) => {
          state.spec.meta.theme = event.target.value;
          scheduleThemePreview();
        };
        document.getElementById('metaFooterLabel').oninput = (event) => {
          state.spec.meta.footerLabel = event.target.value;
        };

        scheduleThemePreview();
      }

      function renderCaptionPreview() {
        ensurePost();
        const title = state.spec.post.title || '（还没写标题）';
        const body = state.spec.post.body || '（还没写正文）';
        const tags = Array.isArray(state.spec.post.tags) && state.spec.post.tags.length
          ? state.spec.post.tags.map((tag) => tag.startsWith('#') ? tag : '#' + tag).join(' ')
          : '（还没写 tags）';
        document.getElementById('captionPreview').innerHTML =
          '<strong>发布文案预览</strong>\\n\\n' +
          escapeHtml(title) + '\\n\\n' +
          escapeHtml(body) + '\\n\\n' +
          escapeHtml(tags);
      }

      function renderPostSection() {
        ensurePost();
        document.getElementById('postTitle').value = state.spec.post.title || '';
        document.getElementById('postTitleCandidates').value = toLines(state.spec.post.titleCandidates);
        document.getElementById('postBody').value = state.spec.post.body || '';
        document.getElementById('postTags').value = toLines(state.spec.post.tags);

        document.getElementById('postTitle').oninput = (event) => {
          state.spec.post.title = event.target.value;
          renderCaptionPreview();
          scheduleThemePreview();
        };
        document.getElementById('postTitleCandidates').oninput = (event) => {
          state.spec.post.titleCandidates = linesToArray(event.target.value);
          scheduleThemePreview();
        };
        document.getElementById('postBody').oninput = (event) => {
          state.spec.post.body = event.target.value;
          renderCaptionPreview();
          scheduleThemePreview();
        };
        document.getElementById('postTags').oninput = (event) => {
          state.spec.post.tags = textToTagArray(event.target.value);
          renderCaptionPreview();
          scheduleThemePreview();
        };

        renderCaptionPreview();
      }

      function renderPageFields(page, index) {
        const commonTop = [
          '<div class="grid">',
          fieldInput(index, 'kicker', '标签', 'text', page.kicker || ''),
          fieldInput(index, 'title', '标题', 'textarea', page.title || ''),
          '</div>'
        ].join('');

        if (page.type === 'cover') {
          return commonTop + fieldInput(index, 'subtitle', '副标题', 'textarea', page.subtitle || '') +
            fieldInput(index, 'chips', '标签 Chips（每行一个）', 'textarea', toLines(page.chips || []), 'lines') +
            fieldInput(index, 'footerNote', '底部备注（可选）', 'textarea', page.footerNote || '');
        }
        if (page.type === 'insights') {
          return commonTop + fieldInput(index, 'lede', '导语', 'textarea', page.lede || '') +
            fieldInput(index, 'insights', '洞察（每行 label | text）', 'textarea', toInsightsLines(page.insights || []), 'insights');
        }
        if (page.type === 'image') {
          return commonTop +
            fieldInput(index, 'lede', '导语', 'textarea', page.lede || '') +
            fieldInput(index, 'image', '图片路径或 URL', 'text', page.image || '') +
            fieldInput(index, 'caption', '图注', 'textarea', page.caption || '') +
            fieldInput(index, 'bullets', '要点（每行一个）', 'textarea', toLines(page.bullets || []), 'lines') +
            fieldInput(index, 'quote', '收束句', 'textarea', page.quote || '');
        }
        if (page.type === 'workflow') {
          return commonTop +
            fieldInput(index, 'lede', '导语', 'textarea', page.lede || '') +
            fieldInput(index, 'bullets', '要点（每行一个）', 'textarea', toLines(page.bullets || []), 'lines') +
            fieldInput(index, 'commandLabel', '提示标签', 'text', page.commandLabel || '') +
            fieldInput(index, 'command', '命令/话术', 'textarea', page.command || '') +
            fieldInput(index, 'quote', '收束句', 'textarea', page.quote || '');
        }
        if (page.type === 'final') {
          return commonTop +
            fieldInput(index, 'lede', '导语', 'textarea', page.lede || '') +
            fieldInput(index, 'bullets', '要点（每行一个）', 'textarea', toLines(page.bullets || []), 'lines') +
            fieldInput(index, 'quote', '收束句', 'textarea', page.quote || '') +
            fieldInput(index, 'footerNote', '底部备注（可选）', 'textarea', page.footerNote || '');
        }
        return commonTop +
          fieldInput(index, 'lede', '导语', 'textarea', page.lede || '') +
          fieldInput(index, 'bullets', '要点（每行一个）', 'textarea', toLines(page.bullets || []), 'lines') +
          fieldInput(index, 'quote', '收束句', 'textarea', page.quote || '');
      }

      function fieldInput(index, field, label, tagName, value, kind) {
        const inputTag = tagName === 'textarea'
          ? '<textarea data-page-index="' + index + '" data-field="' + field + '" data-kind="' + (kind || 'string') + '">' + escapeHtml(value) + '</textarea>'
          : '<input data-page-index="' + index + '" data-field="' + field + '" data-kind="' + (kind || 'string') + '" type="text" value="' + escapeHtml(value) + '" />';
        return '<div class="field"><label>' + escapeHtml(label) + '</label>' + inputTag + '</div>';
      }

      function renderPages() {
        const container = document.getElementById('pages');
        container.innerHTML = state.spec.pages.map((page, index) => {
          return [
            '<article class="page-card">',
            '  <div class="page-head">',
            '    <strong>第 ' + String(index + 1).padStart(2, '0') + ' 页</strong>',
            '    <div class="page-actions">',
            '      <select data-action="type" data-index="' + index + '">',
            typeOptions(page.type),
            '      </select>',
            '      <button type="button" data-action="up" data-index="' + index + '">上移</button>',
            '      <button type="button" data-action="down" data-index="' + index + '">下移</button>',
            '      <button type="button" data-action="duplicate" data-index="' + index + '">复制</button>',
            '      <button type="button" class="danger" data-action="delete" data-index="' + index + '">删除</button>',
            '    </div>',
            '  </div>',
            renderPageFields(page, index),
            '</article>'
          ].join('');
        }).join('');

        bindPageFieldEvents();
        bindPageActionEvents();
      }

      function typeOptions(selectedType) {
        const types = ['cover', 'standard', 'insights', 'image', 'workflow', 'final'];
        return types.map((type) => {
          const selected = type === selectedType ? ' selected' : '';
          return '<option value="' + type + '"' + selected + '>' + type + '</option>';
        }).join('');
      }

      function bindPageFieldEvents() {
        document.querySelectorAll('[data-page-index][data-field]').forEach((element) => {
          element.oninput = (event) => {
            const index = Number(event.target.dataset.pageIndex);
            const field = event.target.dataset.field;
            const kind = event.target.dataset.kind || 'string';
            if (kind === 'lines') {
              state.spec.pages[index][field] = linesToArray(event.target.value);
            } else if (kind === 'insights') {
              state.spec.pages[index][field] = textToInsights(event.target.value);
            } else {
              state.spec.pages[index][field] = event.target.value;
            }
            scheduleThemePreview();
          };
        });
      }

      function bindPageActionEvents() {
        document.querySelectorAll('[data-action]').forEach((element) => {
          const handler = (event) => {
            const action = event.target.dataset.action;
            const index = Number(event.target.dataset.index);
            if (action === 'up' && index > 0) {
              const temp = state.spec.pages[index - 1];
              state.spec.pages[index - 1] = state.spec.pages[index];
              state.spec.pages[index] = temp;
              renderPages();
              scheduleThemePreview();
            }
            if (action === 'down' && index < state.spec.pages.length - 1) {
              const temp = state.spec.pages[index + 1];
              state.spec.pages[index + 1] = state.spec.pages[index];
              state.spec.pages[index] = temp;
              renderPages();
              scheduleThemePreview();
            }
            if (action === 'duplicate') {
              state.spec.pages.splice(index + 1, 0, JSON.parse(JSON.stringify(state.spec.pages[index])));
              renderPages();
              scheduleThemePreview();
            }
            if (action === 'delete') {
              state.spec.pages.splice(index, 1);
              renderPages();
              scheduleThemePreview();
            }
            if (action === 'type') {
              const nextType = event.target.value;
              state.spec.pages[index] = mergePageForType(state.spec.pages[index], nextType);
              renderPages();
              scheduleThemePreview();
            }
          };
          if (element.tagName === 'SELECT') {
            element.onchange = handler;
          } else {
            element.onclick = handler;
          }
        });
      }

      function setStatus(message, tone) {
        const node = document.getElementById('status');
        node.textContent = message;
        node.style.borderColor = tone === 'error' ? '#ff4d4f' : '#d9dde3';
        node.style.color = tone === 'error' ? '#c52124' : '#2d2f33';
      }

      async function fetchJson(url, options) {
        const response = await fetch(url, options);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '请求失败');
        }
        return payload;
      }

      async function loadSpec() {
        setStatus('正在读取 JSON...');
        const payload = await fetchJson('/api/spec');
        state.spec = payload.spec;
        renderMetaSection();
        renderPostSection();
        renderPages();
        await refreshPreviews();
        setStatus('已读取当前数据，可以开始编辑。');
      }

      async function saveSpec() {
        setStatus('正在保存 JSON...');
        await fetchJson('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.spec)
        });
        setStatus('JSON 已保存。');
      }

      async function renderSpec() {
        setStatus('正在保存并重新渲染...');
        await saveSpec();
        const payload = await fetchJson('/api/render', { method: 'POST' });
        state.lastPreviewStamp = Date.now();
        await refreshPreviews();
        setStatus(payload.message || '渲染完成。');
      }

      async function refreshPreviews() {
        const payload = await fetchJson('/api/previews');
        const grid = document.getElementById('previewGrid');
        if (!payload.files.length) {
          grid.innerHTML = '<div class="hint">还没有 PNG，先点一次“保存并重新渲染”。</div>';
          return;
        }
        grid.innerHTML = payload.files.map((fileName) => {
          return [
            '<div class="preview-item">',
            '  <div class="preview-label">' + escapeHtml(fileName) + '</div>',
            '  <img src="/preview/' + encodeURIComponent(fileName) + '?v=' + state.lastPreviewStamp + '" alt="' + escapeHtml(fileName) + '" />',
            '</div>'
          ].join('');
        }).join('');
      }

      document.getElementById('saveButton').onclick = async () => {
        try {
          await saveSpec();
        } catch (error) {
          setStatus(error.message, 'error');
        }
      };

      document.getElementById('renderButton').onclick = async () => {
        try {
          await renderSpec();
        } catch (error) {
          setStatus(error.message, 'error');
        }
      };

      document.getElementById('reloadButton').onclick = async () => {
        try {
          await loadSpec();
        } catch (error) {
          setStatus(error.message, 'error');
        }
      };

      document.getElementById('refreshPreviewButton').onclick = async () => {
        try {
          state.lastPreviewStamp = Date.now();
          await refreshPreviews();
          setStatus('预览已刷新。');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      };

      document.getElementById('addStandardPage').onclick = () => {
        state.spec.pages.push(defaultPage('standard'));
        renderPages();
        scheduleThemePreview();
      };

      document.getElementById('addImagePage').onclick = () => {
        state.spec.pages.push(defaultPage('image'));
        renderPages();
        scheduleThemePreview();
      };

      document.getElementById('addFinalPage').onclick = () => {
        state.spec.pages.push(defaultPage('final'));
        renderPages();
        scheduleThemePreview();
      };

      loadSpec().catch((error) => {
        setStatus(error.message, 'error');
      });
    </script>
  </body>
</html>`;
}

function escapeHtmlForHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function startServer(options) {
  const inputPath = path.resolve(options.input);
  const outputDir = path.resolve(options.output || path.dirname(inputPath));
  const renderScriptPath = path.join(__dirname, 'render_cards.js');
  const html = createHtml({ inputPath, outputDir, themes: listThemes() });

  if (!fs.existsSync(inputPath)) {
    fail(`Input JSON not found: ${inputPath}`);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, 'http://127.0.0.1');

      if (req.method === 'GET' && requestUrl.pathname === '/') {
        sendText(res, 200, html, 'text/html; charset=utf-8');
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/spec') {
        sendJson(res, 200, {
          spec: readJson(inputPath),
          config: {
            inputPath,
            outputDir,
          },
        });
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/save') {
        const raw = await readRequestBody(req);
        const parsed = JSON.parse(raw);
        writeJson(inputPath, parsed);
        sendJson(res, 200, {
          ok: true,
          message: 'JSON 已保存。',
        });
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/theme-preview') {
        const raw = await readRequestBody(req);
        const parsed = raw.trim() ? JSON.parse(raw) : readJson(inputPath);
        sendJson(res, 200, {
          theme: resolveTheme(parsed),
        });
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/render') {
        const stdout = execFileSync(process.execPath, [renderScriptPath, '--input', inputPath, '--output', outputDir], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        sendJson(res, 200, {
          ok: true,
          message: stdout.trim() || '渲染完成。',
        });
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/api/previews') {
        sendJson(res, 200, {
          files: getPreviewFiles(outputDir),
        });
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname.startsWith('/preview/')) {
        const fileName = decodeURIComponent(requestUrl.pathname.slice('/preview/'.length));
        if (!/^[\w.-]+$/.test(fileName)) {
          sendText(res, 400, 'Invalid preview name');
          return;
        }
        sendFile(res, path.join(outputDir, fileName));
        return;
      }

      sendText(res, 404, 'Not found');
    } catch (error) {
      sendJson(res, 500, {
        error: error.message,
      });
    }
  });

  server.listen(options.port, '127.0.0.1', () => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}`;
    console.log(`Editor running at ${url}`);
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputDir}`);
    if (options.open) {
      maybeOpenBrowser(url);
    }
  });
}

function main() {
  const options = parseArgs(process.argv);
  startServer(options);
}

main();
