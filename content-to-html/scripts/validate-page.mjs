#!/usr/bin/env node

/**
 * validate-page.mjs — 沉浸式阅读页质量校验器
 * 用法: node validate-page.mjs <path-to-html>
 *
 * 检查 P0 级问题，任何一条未过 = 不交付
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('用法: node validate-page.mjs <path-to-html>');
  process.exit(1);
}

const html = readFileSync(resolve(filePath), 'utf-8');
const issues = [];
let warnings = [];

// === P0 检查 ===

// 1. IntersectionObserver 存在
if (!html.includes('IntersectionObserver')) {
  issues.push('P0: 缺少 IntersectionObserver（TOC 无法实时高亮）');
}

// 2. TOC 导航存在
if (!/<nav[^>]*/.test(html) && !html.includes('class="toc"') && !html.includes("id=\"toc\"")) {
  issues.push('P0: 缺少 TOC 导航元素（<nav> 或 .toc / #toc）');
}

// 3. 响应式断点
if (!/@media\s*\(/.test(html)) {
  issues.push('P0: 缺少 @media 响应式断点');
}

// 4. CSS 变量使用
const cssVarCount = (html.match(/var\(--/g) || []).length;
if (cssVarCount < 5) {
  issues.push(`P0: CSS 变量使用不足（仅 ${cssVarCount} 处），可能全是 hardcode 颜色`);
}

// 5. section 有 id
const sectionTags = html.match(/<section[^>]*>/g) || [];
const sectionsWithId = sectionTags.filter(s => /id=/.test(s));
if (sectionTags.length > 0 && sectionsWithId.length < sectionTags.length * 0.8) {
  issues.push(`P0: ${sectionTags.length - sectionsWithId.length}/${sectionTags.length} 个 section 缺少 id（TOC 无法锚定）`);
}

// 6. 禁止字体
const forbiddenFonts = ['Inter', 'Roboto', 'Arial'];
for (const font of forbiddenFonts) {
  const fontRegex = new RegExp(`font-family[^;]*${font}`, 'i');
  const linkRegex = new RegExp(`family=${font}`, 'i');
  if (fontRegex.test(html) || linkRegex.test(html)) {
    issues.push(`P0: 使用了禁止字体 "${font}"（AI slop 信号）`);
  }
}

// 7. 紫色渐变
if (/linear-gradient[^;]*#[689a-f]{3,6}[^;]*#[689a-f]{3,6}/i.test(html) ||
    /linear-gradient[^;]*(purple|violet|#6366f1|#8b5cf6|#7c3aed)/i.test(html)) {
  issues.push('P0: 检测到紫色渐变（最常见 AI 风格信号）');
}

// === P1 检查 ===

// 文件行数
const lineCount = html.split('\n').length;
if (lineCount < 800) {
  warnings.push(`P2: 文件仅 ${lineCount} 行（建议 800-1500），可能内容未嚼透`);
} else if (lineCount > 1500) {
  warnings.push(`P2: 文件 ${lineCount} 行（建议 800-1500），可能在堆装饰`);
}

// scrollIntoView
if (!html.includes('scrollIntoView')) {
  warnings.push('P1: 缺少 scrollIntoView（TOC 点击无平滑滚动）');
}

// scroll-behavior
if (!html.includes('scroll-behavior') && !html.includes('scrollBehavior')) {
  warnings.push('P1: 缺少 scroll-behavior: smooth');
}

// Scroll reveal
if (!html.includes('.reveal') && !html.includes('reveal')) {
  warnings.push('P1: 缺少 scroll reveal（内容无滚动显现层次）');
}

// Entrance choreography
if (!/animation-delay|animationDelay/.test(html)) {
  warnings.push('P1: 缺少入场编排（Cover 元素无错位动画）');
}

// Hover micro-interactions
if (!/:hover/.test(html)) {
  warnings.push('P1: 缺少 hover 微交互');
}

// prefers-reduced-motion
if (!/prefers-reduced-motion/.test(html)) {
  warnings.push('P1: 缺少 prefers-reduced-motion 降级');
}

// Self-check / Takeaways 模块
if (!/(self-?check|takeaway|自检|清单)/i.test(html)) {
  warnings.push('P1: 可能缺少 Self-check / Takeaways 模块');
}

// Colophon
if (!/(colophon|设计说明|致读者|出处)/i.test(html)) {
  warnings.push('P1: 可能缺少 Colophon（设计说明）');
}

// Google Fonts 数量
const fontFamilies = html.match(/family=[^&"]+/g) || [];
if (fontFamilies.length > 4) {
  warnings.push(`P2: 加载了 ${fontFamilies.length} 个字体家族（建议 ≤ 4，影响性能）`);
}

// SaaS 套话
const slopPhrases = ['Built with', 'Get Started', 'Learn More', 'Powered by'];
for (const phrase of slopPhrases) {
  if (html.includes(phrase)) {
    warnings.push(`P2: 包含 SaaS 套话 "${phrase}"`);
  }
}

// === 输出结果 ===

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  校验: ${filePath}`);
console.log(`  行数: ${lineCount}`);
console.log('━━���━━━━━━━━━━━━��━━━━━━━━━━���━━━━━━━━━━━━━\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('  ✓ 全部通过\n');
  process.exit(0);
}

if (issues.length > 0) {
  console.log('  ✗ P0 阻断问题（必须修复）:\n');
  issues.forEach(i => console.log(`    • ${i}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('  ⚠ 建议改进:\n');
  warnings.forEach(w => console.log(`    • ${w}`));
  console.log('');
}

console.log('━━━━━━━━━━━━━━���━━━━���━━━━━━━���━━━━━━━━━━━━\n');
process.exit(issues.length > 0 ? 1 : 0);
