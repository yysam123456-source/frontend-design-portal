// 从已克隆的仓库中提取组件数据，生成统一的 JSON 数据库
// 同时支持通过 GitHub API 获取未成功克隆的仓库

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reposDir = path.join(__dirname, '..', 'repos')
const outputDir = path.join(__dirname, '..', 'public', 'data')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

function walkFiles(dir, predicate) {
  const files = []
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath, predicate))
    } else if (!predicate || predicate(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

function toTitleCase(name) {
  return name
    .replace(/\.(tsx|jsx|ts|js|html|mdx)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function slugify(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function stripTags(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFirst(source, pattern) {
  return source.match(pattern)?.[1]?.trim() || ''
}

function inferAnimeCategory(id, title = '') {
  const key = `${id} ${title}`.toLowerCase()
  if (key.includes('draggable')) return 'draggable'
  if (key.includes('timeline')) return 'timeline'
  if (key.includes('timer')) return 'timer'
  if (key.includes('scroll') || key.includes('onscroll')) return 'scroll'
  if (key.includes('svg') || key.includes('drawable') || key.includes('morph') || key.includes('motion-path')) return 'svg'
  if (key.includes('stagger')) return 'stagger'
  if (key.includes('scope') || key.includes('media')) return 'scope'
  if (key.includes('waapi')) return 'waapi'
  if (key.includes('easing') || key.includes('spring')) return 'easing'
  if (key.includes('utils') || key.includes('random') || key.includes('map-range')) return 'utilities'
  return 'animation'
}

function inferAnimeStyle(id, title = '') {
  const category = inferAnimeCategory(id, title)
  const key = `${id} ${title}`.toLowerCase()
  const styles = ['official-demo', category]
  for (const token of [
    'transform',
    'stagger',
    'timeline',
    'svg',
    'path',
    'spring',
    'scroll',
    'draggable',
    'waapi',
    'scope',
    'easing',
    'text',
    'dom',
  ]) {
    if (key.includes(token) && !styles.includes(token)) styles.push(token)
  }
  return styles
}

function buildAnimeRuntimeHtml({ id, css = '', html = '', js = '' }) {
  return `<style>
  :root { color-scheme: dark; }
  html, body {
    margin: 0;
    overflow: hidden;
  }
  .anime-demo-stage {
    width: min(100%, 760px);
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
    color: #f8fafc;
  }
  .anime-demo-stage .demo,
  .anime-demo-stage .docs-demo-html {
    width: 100%;
    min-height: 260px;
    display: grid;
    place-items: center;
  }
  .anime-demo-stage .row { display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .anime-demo-stage .col { display: flex; flex-direction: column; gap: 8px; }
  .anime-demo-stage .centered { display: flex; align-items: center; justify-content: center; }
  .anime-demo-stage .large { font-size: 20px; }
  .anime-demo-stage .log { min-width: 180px; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); }
  .anime-demo-stage .label { display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
  .anime-demo-stage .value, .anime-demo-stage .lcd { color: #67e8f9; font-variant-numeric: tabular-nums; }
  .anime-demo-stage .shape, .anime-demo-stage .square, .anime-demo-stage .circle, .anime-demo-stage .dot {
    width: 42px;
    height: 42px;
    border: 2px solid currentColor;
    color: #ff4f9a;
    background: rgba(255,79,154,.18);
    box-shadow: 0 0 28px rgba(255,79,154,.28);
  }
  .anime-demo-stage .circle, .anime-demo-stage .dot { border-radius: 999px; }
  .anime-demo-stage svg { max-width: min(100%, 460px); max-height: 300px; overflow: visible; color: #67e8f9; }
  .anime-demo-stage .modular-showcase {
    width: 100%;
    min-height: 350px;
    display: grid;
    grid-template-columns: minmax(138px, .68fr) minmax(320px, 1.32fr);
    gap: 18px;
    align-items: center;
    padding: 20px;
    border-radius: 24px;
    background:
      radial-gradient(circle at 70% 38%, rgba(255,79,154,.18), transparent 34%),
      radial-gradient(circle at 35% 72%, rgba(103,232,249,.14), transparent 32%),
      linear-gradient(135deg, #050510, #09091a 54%, #04040a);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 24px 80px rgba(0,0,0,.32);
    overflow: hidden;
    position: relative;
  }
  .anime-demo-stage .modular-showcase::before {
    content: "";
    position: absolute;
    inset: -20%;
    background-image:
      linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 32px 32px;
    transform: rotateX(62deg) rotateZ(-18deg) translateY(60px);
    opacity: .32;
  }
  .anime-demo-stage .module-copy,
  .anime-demo-stage .module-viewport,
  .anime-demo-stage .module-progress { position: relative; z-index: 1; }
  .anime-demo-stage .module-copy { display: grid; gap: 12px; align-content: center; }
  .anime-demo-stage .module-copy .eyebrow {
    color: #ff4f9a;
    font-size: 11px;
    letter-spacing: .22em;
    font-weight: 800;
  }
  .anime-demo-stage .module-copy strong {
    color: #fff;
    font-size: clamp(24px, 3.2vw, 42px);
    line-height: .93;
    letter-spacing: -.05em;
  }
  .anime-demo-stage .module-copy small { max-width: 220px; color: #94a3b8; line-height: 1.45; }
  .anime-demo-stage .module-viewport {
    min-height: 260px;
    display: grid;
    place-items: center;
    perspective: 920px;
    perspective-origin: 50% 46%;
  }
  .anime-demo-stage .module-scene {
    width: 300px;
    height: 238px;
    position: relative;
    transform-style: preserve-3d;
  }
  .anime-demo-stage .engine-core,
  .anime-demo-stage .module-chip,
  .anime-demo-stage .bundle-case,
  .anime-demo-stage .orbit-line,
  .anime-demo-stage .size-panel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-style: preserve-3d;
  }
  .anime-demo-stage .engine-core {
    width: 126px;
    height: 126px;
    margin: -63px;
    display: grid;
    place-items: center;
    border-radius: 32px;
    background: linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.04));
    border: 1px solid rgba(255,255,255,.2);
    box-shadow: 0 0 46px rgba(255,79,154,.34), inset 0 0 36px rgba(103,232,249,.08);
    backdrop-filter: blur(18px);
  }
  .anime-demo-stage .core-ring {
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(103,232,249,.32);
    border-radius: 26px;
  }
  .anime-demo-stage .ring-b { inset: 26px; border-color: rgba(255,79,154,.42); transform: rotate(45deg); }
  .anime-demo-stage .core-title { color: #fff; font-size: 18px; font-weight: 900; letter-spacing: -.04em; }
  .anime-demo-stage .core-size { margin-top: 42px; color: #67e8f9; font-size: 11px; }
  .anime-demo-stage .module-chip {
    width: 112px;
    height: 54px;
    margin: -27px -56px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: #fff;
    background: linear-gradient(135deg, rgba(103,232,249,.18), rgba(255,79,154,.12));
    border: 1px solid hsla(var(--h), 90%, 70%, .55);
    box-shadow: 0 0 28px hsla(var(--h), 90%, 62%, .28), inset 0 1px 0 rgba(255,255,255,.18);
  }
  .anime-demo-stage .module-chip span { font-size: 12px; font-weight: 800; }
  .anime-demo-stage .module-chip b { color: #cbd5e1; font-size: 10px; font-weight: 600; }
  .anime-demo-stage .orbit-line {
    width: 290px;
    height: 122px;
    margin: -61px -145px;
    border: 1px solid rgba(103,232,249,.24);
    border-radius: 999px;
    transform: rotateX(68deg);
  }
  .anime-demo-stage .orbit-b { width: 235px; transform: rotateX(68deg) rotateZ(60deg); }
  .anime-demo-stage .orbit-c { width: 205px; transform: rotateX(68deg) rotateZ(-60deg); border-color: rgba(255,79,154,.2); }
  .anime-demo-stage .bundle-case {
    width: 190px;
    height: 150px;
    margin: -75px -95px;
    opacity: 0;
    border-radius: 34px;
    border: 1px solid rgba(255,255,255,.18);
    background: linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.03));
    box-shadow: inset 0 0 24px rgba(255,255,255,.06), 0 0 55px rgba(103,232,249,.15);
  }
  .anime-demo-stage .case-front { border-color: rgba(255,79,154,.32); }
  .anime-demo-stage .size-panel {
    width: 150px;
    margin: 66px 0 0 94px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(2,6,23,.58);
    border: 1px solid rgba(255,255,255,.12);
    color: #e2e8f0;
    backdrop-filter: blur(14px);
    transform: translateZ(80px);
    opacity: 0;
  }
  .anime-demo-stage .size-panel span { display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
  .anime-demo-stage .size-panel strong { display: block; margin: 3px 0 8px; color: #fff; font-size: 20px; letter-spacing: -.04em; }
  .anime-demo-stage .size-panel .bar {
    display: block;
    height: 5px;
    margin-top: 5px;
    border-radius: 99px;
    transform-origin: left center;
    background: linear-gradient(90deg, #ff4f9a, #67e8f9);
  }
  .anime-demo-stage .module-progress {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 14px;
    align-items: center;
  }
  .anime-demo-stage .phase-label {
    color: #67e8f9;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .18em;
  }
  .anime-demo-stage .module-scrub {
    width: 100%;
    accent-color: #ff4f9a;
  }
  @media (max-width: 720px) {
    .anime-demo-stage .modular-showcase { grid-template-columns: 1fr; }
    .anime-demo-stage .module-copy { text-align: center; justify-items: center; }
  }
  .anime-demo-stage [style*="var(--"] {
    --hex-red-1: #ff4f9a;
    --hex-orange-1: #ff9f1c;
    --hex-yellow-1: #ffe66d;
    --hex-green-1: #6ee7b7;
    --hex-cyan-1: #67e8f9;
    --hex-blue-1: #60a5fa;
    --hex-purple-1: #a78bfa;
  }
${css}
</style>
<div class="anime-demo-stage" data-demo-id="${id}">
${html || '<div class="shape square"></div>'}
</div>
<script type="module">
import * as anime from 'https://cdn.jsdelivr.net/npm/animejs@4.0.0/+esm'
const root = document.querySelector('[data-demo-id="${id}"]')
const previousDemos = window.demos || {}
window.demos = {}
try {
${js}
  const demo = window.demos[${JSON.stringify(id)}]
  const utils = anime.utils || {
    $: (selector) => Array.from((root || document).querySelectorAll(selector)),
    set: anime.set || (() => {}),
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomPick: (items) => items[Math.floor(Math.random() * items.length)],
    round: (value, precision = 0) => Number(Number(value).toFixed(precision)),
  }
  if (typeof demo === 'function') {
    demo(
      { root },
      anime.animate,
      anime.createTimeline,
      anime.createTimer,
      anime.createAnimatable,
      anime.createDraggable,
      anime.createLayout || (() => {}),
      anime.createScope,
      anime.onScroll,
      anime.engine,
      anime.easings || {},
      anime.steps,
      anime.linear,
      anime.irregular,
      anime.spring,
      anime.cubicBezier,
      anime.stagger,
      utils,
      anime.svg || {},
      anime.waapi || {},
      anime.text || {},
      anime.splitText || (() => null),
      anime.scrambleText || (() => null),
      () => {},
      () => [],
      () => {},
    )
  }
} catch (error) {
  console.warn('Anime.js demo fallback:', error)
  const badge = document.createElement('div')
  badge.textContent = 'Static official preview'
  badge.style.cssText = 'position:absolute;right:10px;bottom:10px;padding:5px 8px;border-radius:999px;background:rgba(15,23,42,.72);color:#cbd5e1;font:10px system-ui;letter-spacing:.02em;backdrop-filter:blur(10px);pointer-events:none'
  root.style.position = root.style.position || 'relative'
  root.appendChild(badge)
} finally {
  window.demos = previousDemos
}
</script>`
}

// ============ react-bits ============
function extractReactBits() {
  const components = []
  const codeDir = path.join(reposDir, 'react-bits', 'src', 'constants', 'code')
  if (!fs.existsSync(codeDir)) return components

  const categories = fs.readdirSync(codeDir).filter(f => fs.statSync(path.join(codeDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(codeDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.js', '')

      // 尝试提取代码字符串
      const codeMatch = content.match(/['"`]([\s\S]*?)['"`];?\s*$/)
      const code = codeMatch ? codeMatch[1] : content

      components.push({
        id: `rb-${name.toLowerCase()}`,
        project: 'react-bits',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category.toLowerCase(),
        style: ['react', 'animation'],
        techStack: ['React', 'CSS'],
        description: `${name} animation component`,
        codeSnippet: {
          language: 'jsx',
          source: code,
          dependencies: [],
        },
      })
    }
  }

  return components
}

// ============ animata ============
function extractAnimata() {
  const components = []
  const animataDir = path.join(reposDir, 'animata', 'animata')
  if (!fs.existsSync(animataDir)) return components

  const categories = fs.readdirSync(animataDir).filter(f => fs.statSync(path.join(animataDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(animataDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.tsx') && !f.includes('.stories.'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const code = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.tsx', '')

      components.push({
        id: `at-${name.toLowerCase()}`,
        project: 'animata',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category,
        style: ['react', 'tailwind', 'animation'],
        techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
        description: `${name} 交互动效组件`,
        codeSnippet: {
          language: 'tsx',
          source: code,
          dependencies: ['framer-motion'],
        },
      })
    }
  }

  return components
}

// ============ uiverse (galaxy) ============
function extractUiverse() {
  const components = []
  const galaxyDir = path.join(reposDir, 'galaxy')
  if (!fs.existsSync(galaxyDir)) return components

  const categories = fs.readdirSync(galaxyDir).filter(f => fs.statSync(path.join(galaxyDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(galaxyDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.html'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const code = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.html', '')

      components.push({
        id: `uv-${name.toLowerCase()}`,
        project: 'uiverse',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category.toLowerCase(),
        style: ['css', 'html', 'pure-css'],
        techStack: ['HTML', 'CSS'],
        description: `${name} CSS 组件`,
        codeSnippet: {
          language: 'html',
          source: code,
          dependencies: [],
        },
      })
    }
  }

  return components
}

// ============ pixel2motion ============
function extractPixel2Motion() {
  const components = []
  const docsDir = path.join(reposDir, 'pixel2motion', 'docs')
  if (!fs.existsSync(docsDir)) return components

  // pixel2motion 是工具，不是组件库，提取其展示页面的效果
  const indexHtml = path.join(docsDir, 'index.html')
  if (fs.existsSync(indexHtml)) {
    components.push({
      id: 'p2m-showcase',
      project: 'pixel2motion',
      name: 'Logo Motion Showcase',
      category: 'logo-animation',
      style: ['svg', 'animation'],
      techStack: ['SVG', 'CSS Animation'],
      description: 'AI Logo 动画展示页面',
      codeSnippet: {
        language: 'html',
        source: fs.readFileSync(indexHtml, 'utf-8'),
        dependencies: [],
      },
    })
  }

  return components
}

// ============ anime.js (官网首页 showcase + documentation demos) ============
function extractAnimeJS() {
  const components = []

  const homeShowcases = [
    {
      id: 'modules-scroll',
      name: 'Modular API Scroll Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'modules', 'scroll', 'timeline', 'css-3d', 'bundle-size'],
      html: `<div class="modular-showcase" aria-label="Anime.js modular API scroll showcase">
  <div class="module-copy">
    <span class="eyebrow">MODULES</span>
    <strong>A lightweight<br/>and modular API</strong>
    <small>Scroll or drag the progress rail to inspect the engine structure.</small>
  </div>
  <div class="module-viewport">
    <div class="module-scene">
      <div class="bundle-case case-back"></div>
      <div class="bundle-case case-front"></div>
      <div class="engine-core">
        <span class="core-ring ring-a"></span>
        <span class="core-ring ring-b"></span>
        <span class="core-title">anime.js</span>
        <span class="core-size"><b>24.50</b> KB</span>
      </div>
      <div class="module-chip module-animation" style="--x:0;--y:-112;--z:22;--h:338"><span>Animation</span><b>5.20 KB</b></div>
      <div class="module-chip module-timeline" style="--x:112;--y:-48;--z:34;--h:42"><span>Timeline</span><b>0.55 KB</b></div>
      <div class="module-chip module-waapi" style="--x:112;--y:62;--z:-6;--h:202"><span>WAAPI</span><b>3.50 KB</b></div>
      <div class="module-chip module-scroll" style="--x:0;--y:122;--z:26;--h:184"><span>Scroll</span><b>4.30 KB</b></div>
      <div class="module-chip module-draggable" style="--x:-112;--y:62;--z:-2;--h:20"><span>Draggable</span><b>6.41 KB</b></div>
      <div class="module-chip module-svg" style="--x:-112;--y:-48;--z:38;--h:188"><span>SVG</span><b>0.35 KB</b></div>
      <div class="orbit-line orbit-a"></div>
      <div class="orbit-line orbit-b"></div>
      <div class="orbit-line orbit-c"></div>
      <div class="size-panel">
        <span>Bundle size</span>
        <strong><em class="bundle-number">24.50</em> KB</strong>
        <i class="bar bar-animation"></i>
        <i class="bar bar-timeline"></i>
        <i class="bar bar-waapi"></i>
        <i class="bar bar-scroll"></i>
        <i class="bar bar-draggable"></i>
        <i class="bar bar-svg"></i>
      </div>
    </div>
  </div>
  <div class="module-progress">
    <span class="phase-label">MODULES</span>
    <input class="module-scrub" type="range" min="0" max="1000" value="0" aria-label="Scroll progress" />
  </div>
</div>`,
      js: `window.demos['home-modules-scroll'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger, utils) {
  const root = ctx.root || document;
  const scene = root.querySelector('.module-scene');
  const scrub = root.querySelector('.module-scrub');
  const label = root.querySelector('.phase-label');
  const bundle = root.querySelector('.bundle-number');
  const chips = Array.from(root.querySelectorAll('.module-chip'));
  const cases = Array.from(root.querySelectorAll('.bundle-case'));
  const phases = [
    [0, 'MODULES'],
    [180, 'TRANSFORM'],
    [430, 'SHRINK'],
    [650, 'ROTATE'],
    [820, 'CASE'],
    [1000, 'END'],
  ];

  const timeline = createTimeline({
    autoplay: false,
    defaults: { ease: 'inOut(3)', composition: 'replace' },
    onUpdate: self => {
      const time = self.currentTime || 0;
      const current = phases.reduce((name, phase) => time >= phase[0] ? phase[1] : name, phases[0][1]);
      label.textContent = current;
      scrub.value = Math.round((time / 5200) * 1000);
    }
  })
  .add(scene, { rotateX: [58, 42], rotateY: [-22, -360], z: [-80, 0], duration: 1200 }, 0)
  .add('.engine-core', { scale: [0.82, 1], rotateZ: [0, 45], duration: 900 }, 0)
  .add('.orbit-line', { opacity: [0.08, 0.55], scale: [0.75, 1.18], duration: 900, delay: stagger(90) }, 120)
  .add(chips, {
    opacity: [0.35, 1],
    x: el => Number(el.style.getPropertyValue('--x')),
    y: el => Number(el.style.getPropertyValue('--y')),
    z: el => Number(el.style.getPropertyValue('--z')),
    rotateY: (_, i) => i % 2 ? -14 : 14,
    scale: [0.55, 1],
    duration: 900,
    delay: stagger(70, { from: 'center' }),
  }, 240)
  .add('.size-panel', { opacity: [0, 1], y: [24, 0], duration: 550 }, 700)
  .add('.bar', { scaleX: [0, 1], duration: 800, delay: stagger(45) }, 820)
  .add(chips, {
    x: (_, i) => i % 2 ? -178 : 178,
    y: (_, i) => [-92, -48, 18, 82, 42, -18][i],
    z: (_, i) => [48, 28, 4, 34, 10, 42][i],
    rotateY: (_, i) => i % 2 ? -72 : 72,
    duration: 850,
    delay: stagger(35),
  }, 1450)
  .add('.orbit-line', { scale: 0.62, opacity: 0.18, duration: 700 }, 1700)
  .add('.bar', { scaleX: 0.08, duration: 700, delay: stagger(35) }, 2050)
  .add(bundle, { innerHTML: [24.50, 5.60], modifier: value => Number(value).toFixed(2), duration: 850 }, 2050)
  .add(chips, {
    scale: 0.08,
    opacity: 0.18,
    x: (_, i) => i % 2 ? -38 : 38,
    y: (_, i) => i % 2 ? -16 : 16,
    rotateY: (_, i) => i % 2 ? -90 : 90,
    duration: 820,
    delay: stagger(30),
  }, 2600)
  .add(scene, { rotateX: 16, rotateY: -720, z: 80, duration: 1200 }, 3000)
  .add(cases, { opacity: [0, 1], scale: [1.25, 1], rotateX: [28, 0], z: (_, i) => i ? 42 : -42, duration: 900, delay: stagger(120) }, 3350)
  .add('.engine-core', { scale: 0.86, rotateZ: 0, duration: 650 }, 3650)
  .add(chips, { opacity: 0.05, duration: 420 }, 3700)
  .add('.orbit-line', { opacity: 0, duration: 420 }, 3800)
  .add(cases, { z: 0, rotateX: 0, duration: 720, ease: 'out(3)' }, 4150)
  .add(scene, { rotateX: 50, rotateY: -1040, z: -40, duration: 950 }, 4250)
  .add(chips, {
    opacity: 0.9,
    scale: 0.72,
    x: el => Number(el.style.getPropertyValue('--x')) * 0.62,
    y: el => Number(el.style.getPropertyValue('--y')) * 0.62,
    z: el => Number(el.style.getPropertyValue('--z')),
    rotateY: 0,
    duration: 800,
    delay: stagger(45, { from: 'center' }),
  }, 4550)
  .add('.orbit-line', { opacity: 0.32, scale: 0.88, duration: 650 }, 4700);

  const seek = progress => {
    const clamped = Math.max(0, Math.min(1, progress));
    timeline.seek(clamped * 5200);
  };

  const playhead = { p: 0 };
  let auto = animate(playhead, {
    p: 1,
    duration: 8400,
    loop: true,
    alternate: true,
    ease: 'inOutSine',
    onUpdate: () => seek(playhead.p)
  });

  const stopAuto = () => auto && auto.pause();
  scrub.addEventListener('input', () => {
    stopAuto();
    seek(Number(scrub.value) / 1000);
  });
  root.addEventListener('wheel', event => {
    event.preventDefault();
    stopAuto();
    seek((Number(scrub.value) + Math.sign(event.deltaY) * 60) / 1000);
  }, { passive: false });

  seek(0.04);
  return () => {
    stopAuto();
    timeline.pause();
  };
}`,
    },
    {
      id: 'intuitive',
      name: 'Intuitive API Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'animation', 'transform'],
      html: '<div class="shape square fill"></div>',
      js: `window.demos['home-intuitive'] = function(ctx, animate) {
  animate('.square', {
    rotate: 90,
    scale: [0.2, 1],
    loop: true,
    alternate: true,
    duration: 750,
    ease: 'inOutExpo'
  })
}`,
    },
    {
      id: 'composition',
      name: 'Composition Transform Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'composition', 'transform'],
      html: '<div class="row">' + Array.from({ length: 12 }, (_, i) => `<div class="shape ${i % 2 ? 'circle' : 'square'}"></div>`).join('') + '</div>',
      js: `window.demos['home-composition'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger, utils) {
  animate('.shape', {
    x: () => utils.random(-90, 90),
    y: () => utils.random(-70, 70),
    rotate: () => utils.random(-180, 180),
    scale: () => utils.random(.45, 1.25),
    composition: 'blend',
    loop: true,
    alternate: true,
    delay: stagger(80),
    duration: () => utils.random(700, 1400),
    ease: 'inOutQuad'
  })
}`,
    },
    {
      id: 'scroll',
      name: 'Scroll Observer Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'scroll', 'svg'],
      html: '<svg viewBox="0 0 240 240"><g fill="none" stroke="currentColor" stroke-width="3">' + Array.from({ length: 12 }, (_, i) => `<circle cx="120" cy="120" r="${18 + i * 7}" opacity="${1 - i * 0.055}" />`).join('') + '</g></svg>',
      js: `window.demos['home-scroll'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger) {
  animate('circle', {
    strokeDasharray: '8 16',
    strokeDashoffset: [0, 160],
    rotate: [0, 360],
    transformOrigin: '120px 120px',
    delay: stagger(70),
    loop: true,
    duration: 2200,
    ease: 'linear'
  })
}`,
    },
    {
      id: 'staggering',
      name: 'Advanced Staggering Grid Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'stagger', 'grid'],
      html: '<div class="stagger-grid">' + Array.from({ length: 169 }, () => '<span></span>').join('') + '</div><style>.stagger-grid{display:grid;grid-template-columns:repeat(13,10px);gap:7px}.stagger-grid span{width:10px;height:10px;border-radius:50%;background:#67e8f9;box-shadow:0 0 16px #67e8f9}</style>',
      js: `window.demos['home-staggering'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger) {
  animate('.stagger-grid span', {
    scale: [0.25, 1.7, 0.55],
    opacity: [0.25, 1, 0.45],
    delay: stagger(38, { grid: [13, 13], from: 'center' }),
    loop: true,
    duration: 1100,
    ease: 'inOutQuad'
  })
}`,
    },
    {
      id: 'svg-utils',
      name: 'SVG Motion Path Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'svg', 'motion-path'],
      html: '<svg viewBox="0 0 320 150"><path class="track" d="M20 90 C80 10, 130 140, 190 75 S270 20, 300 90" fill="none" stroke="rgba(103,232,249,.28)" stroke-width="8"/><path class="track-draw" d="M20 90 C80 10, 130 140, 190 75 S270 20, 300 90" fill="none" stroke="#67e8f9" stroke-width="3"/><circle class="car" r="9" fill="#ff4f9a"/></svg>',
      js: `window.demos['home-svg-utils'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger, utils, svg) {
  createTimeline({ loop: true })
    .add('.car', { duration: 3200, ease: 'linear', ...svg.createMotionPath('.track') }, 0)
    .add(svg.createDrawable('.track-draw'), { draw: ['0 0', '0 1', '1 1'], duration: 3200, ease: 'inOutSine' }, 0)
}`,
    },
    {
      id: 'draggable',
      name: 'Draggable Spring Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'draggable', 'spring'],
      html: '<div class="draggable-dot"></div><style>.draggable-dot{width:74px;height:74px;border-radius:50%;background:#ff4f9a;box-shadow:0 0 42px rgba(255,79,154,.62);cursor:grab}</style>',
      js: `window.demos['home-draggable'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger, utils, svg, waapi, text, splitText, scrambleText, createViewer, getInstances, commitChanges) {
  const dot = document.querySelector('.draggable-dot')
  createDraggable(dot, { container: [0, 0, 0, 0], releaseEase: spring({ stiffness: 120, damping: 6 }) })
  animate(dot, { scale: [0.7, 1.15], loop: true, alternate: true, duration: 900, ease: 'inOutSine' })
}`,
    },
    {
      id: 'clockwork',
      name: 'Clockwork Timeline Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'timeline', 'clock'],
      html: '<div class="clock-face">' + Array.from({ length: 60 }, (_, i) => `<span style="--i:${i}"></span>`).join('') + '</div><style>.clock-face{position:relative;width:210px;height:210px;border-radius:50%;border:1px solid rgba(255,255,255,.16)}.clock-face span{position:absolute;left:50%;top:50%;width:3px;height:14px;background:#67e8f9;transform:rotate(calc(var(--i)*6deg)) translateY(-92px);transform-origin:0 0;box-shadow:0 0 12px #67e8f9}</style>',
      js: `window.demos['home-clockwork'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger) {
  createTimeline({ loop: true })
    .add('.clock-face span', {
      scaleY: [0.35, 1.8, 0.7],
      opacity: [0.2, 1, 0.35],
      delay: stagger(18),
      duration: 420,
      ease: 'inOutQuad'
    })
}`,
    },
    {
      id: 'responsive',
      name: 'Responsive Scope Showcase',
      category: 'official-showcase',
      style: ['official-showcase', 'scope', 'responsive'],
      html: '<div class="responsive-box"><span></span><span></span><span></span><span></span><span></span></div><style>.responsive-box{width:260px;height:150px;border:1px solid rgba(255,255,255,.2);border-radius:26px;display:flex;align-items:center;justify-content:center;gap:14px;background:rgba(255,255,255,.05)}.responsive-box span{width:22px;height:22px;border-radius:50%;background:#a78bfa;box-shadow:0 0 24px #a78bfa}</style>',
      js: `window.demos['home-responsive'] = function(ctx, animate, createTimeline, createTimer, createAnimatable, createDraggable, createLayout, createScope, onScroll, engine, eases, steps, linear, irregular, spring, cubicBezier, stagger) {
  createTimeline({ loop: true, alternate: true })
    .add('.responsive-box', { width: ['260px', '160px'], height: ['150px', '230px'], duration: 1200, ease: 'inOutExpo' }, 0)
    .add('.responsive-box span', { y: [0, stagger([-48, 48])], x: [stagger([-42, 42]), 0], delay: stagger(80), duration: 900, ease: 'inOutQuad' }, 0)
}`,
    },
  ]

  for (const demo of homeShowcases) {
    components.push({
      id: `aj-home-${demo.id}`,
      project: 'animejs',
      name: `Anime.js ${demo.name}`,
      category: demo.category,
      style: demo.style,
      techStack: ['JavaScript', 'Anime.js', 'HTML', 'CSS'],
      description: `Official Anime.js homepage showcase: ${demo.name}.`,
      codeSnippet: {
        language: 'html',
        source: buildAnimeRuntimeHtml({
          id: `home-${demo.id}`,
          html: demo.html,
          js: demo.js,
        }),
        dependencies: ['animejs'],
      },
    })
  }

  const animeDir = path.join(reposDir, 'anime')
  const demosHtmlPath = path.join(animeDir, 'documentation-demos.html')
  if (!fs.existsSync(demosHtmlPath)) {
    fs.mkdirSync(animeDir, { recursive: true })
    try {
      console.log('Fetching Anime.js official documentation demos...')
      execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `Invoke-WebRequest -Uri 'https://animejs.com/documentation-demos' -OutFile '${demosHtmlPath.replace(/'/g, "''")}'`,
        ],
        { stdio: 'inherit' }
      )
    } catch (error) {
      console.warn('Unable to fetch Anime.js official demos. Falling back to homepage showcases only.')
    }
  }

  if (!fs.existsSync(demosHtmlPath)) return components

  const demosHtml = fs.readFileSync(demosHtmlPath, 'utf-8')
  const articlePattern = /<article class="docs-demo" data-id="([^"]+)" data-color="([^"]*)">([\s\S]*?)<\/article>/g
  let match
  while ((match = articlePattern.exec(demosHtml))) {
    const [, officialId, color, body] = match
    const rawTitle = extractFirst(body, /<h2[^>]*>([\s\S]*?)<\/h2>/)
    const title = stripTags(rawTitle) || toTitleCase(officialId)
    const css = extractFirst(body, /<style[^>]*class="docs-demo-css"[^>]*>([\s\S]*?)<\/style>/)
    const liveHtml = extractFirst(
      body,
      /<div class="docs-demo-html docs-demo-live demo">([\s\S]*?)<\/div>\s*<div class="docs-demo-html docs-demo-template"/
    )
    const js = extractFirst(body, /<script class="docs-demo-js">([\s\S]*?)<\/script>/)
    if (!js) continue

    const category = inferAnimeCategory(officialId, title)
    const id = `aj-doc-${slugify(officialId)}`
    components.push({
      id,
      project: 'animejs',
      name: `Anime.js ${title}`,
      category,
      style: inferAnimeStyle(officialId, title),
      techStack: ['JavaScript', 'Anime.js', 'HTML', 'CSS'],
      description: `Official Anime.js documentation demo: ${title}.`,
      codeSnippet: {
        language: 'html',
        source: buildAnimeRuntimeHtml({
          id: officialId,
          css,
          html: liveHtml,
          js,
        }),
        dependencies: ['animejs'],
        sourceUrl: `https://animejs.com/documentation-demos#${officialId}`,
        color,
      },
    })
  }

  return components
}

// ============ zelda-hyrule-ui (从已克隆的源码中提取) ============
function extractZelda() {
  const components = []

  const componentsDir = path.join(
    reposDir,
    'zelda-hyrule-ui',
    'packages',
    'react',
    'src',
    'components'
  )
  if (!fs.existsSync(componentsDir)) return components

  const files = walkFiles(
    componentsDir,
    (file) =>
      file.endsWith('.tsx') &&
      !file.endsWith('index.tsx') &&
      !file.includes('.test.') &&
      !file.includes('.spec.')
  )

  for (const filePath of files) {
    const code = fs.readFileSync(filePath, 'utf-8')
    const relative = path.relative(componentsDir, filePath)
    const parts = relative.split(path.sep)
    const file = path.basename(filePath)
    const name = file.replace('.tsx', '')
    const category = parts.length > 1 ? parts[0].toLowerCase() : 'core'

    components.push({
      id: `zh-${relative.replace(/\\/g, '-').replace(/\//g, '-').replace('.tsx', '').toLowerCase()}`,
      project: 'zelda-hyrule-ui',
      name: toTitleCase(name),
      category,
      style: ['game-ui', 'zelda', 'dark', category],
      techStack: ['React', 'Less', 'TypeScript'],
      description: `塞尔达风格 ${toTitleCase(name)} 组件`,
      codeSnippet: {
        language: 'tsx',
        source: code,
        dependencies: ['@chaos-xxl/zelda-hyrule-ui'],
      },
    })
  }

  return components
}

// ============ eldoraui (从已克隆的源码中提取) ============
function extractEldora() {
  const components = []

  const registryDir = path.join(reposDir, 'eldoraui', 'apps', 'www', 'registry')
  const componentDir = path.join(registryDir, 'eldoraui')
  const exampleDir = path.join(registryDir, 'example')

  const addFiles = (dir, category, prefix) => {
    const files = walkFiles(
      dir,
      (file) =>
        file.endsWith('.tsx') &&
        !file.includes('__index__') &&
        !file.includes('.test.') &&
        !file.includes('.spec.')
    )

    for (const filePath of files) {
      const code = fs.readFileSync(filePath, 'utf-8')
      const relative = path.relative(dir, filePath)
      const file = path.basename(filePath)
      const name = file.replace('.tsx', '')
      const cleanName = name.replace(/-demo-\d+$/, '').replace(/-demo$/, '')

      components.push({
        id: `ed-${prefix}-${relative.replace(/\\/g, '-').replace(/\//g, '-').replace('.tsx', '').toLowerCase()}`,
        project: 'eldoraui',
        name: toTitleCase(cleanName),
        category,
        style: ['react', 'tailwind', 'modern', category],
        techStack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
        description:
          category === 'example'
            ? `${toTitleCase(cleanName)} example component`
            : `${toTitleCase(cleanName)} UI 组件`,
        codeSnippet: {
          language: 'tsx',
          source: code,
          dependencies: ['framer-motion', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      })
    }
  }

  addFiles(componentDir, 'component', 'component')
  addFiles(exampleDir, 'example', 'example')

  return components
}

// ============ 主流程 ============
console.log('Extracting components from cloned repos...')

const allComponents = [
  ...extractReactBits(),
  ...extractAnimata(),
  ...extractUiverse(),
  ...extractPixel2Motion(),
  ...extractAnimeJS(),
  ...extractZelda(),
  ...extractEldora(),
]

// 统计
const stats = {}
for (const c of allComponents) {
  stats[c.project] = (stats[c.project] || 0) + 1
}

console.log('\n=== Extraction Results ===')
for (const [project, count] of Object.entries(stats)) {
  console.log(`  ${project}: ${count} components`)
}
console.log(`\nTotal: ${allComponents.length} components`)

// 保存
const outputPath = path.join(outputDir, 'components.json')
fs.writeFileSync(outputPath, JSON.stringify(allComponents, null, 2))
console.log(`\nSaved to ${outputPath}`)

for (const [project, count] of Object.entries(stats)) {
  const projectItems = allComponents.filter((item) => item.project === project)
  const projectPath = path.join(outputDir, `${project}.json`)
  fs.writeFileSync(projectPath, JSON.stringify(projectItems, null, 2))
  console.log(`Saved ${count} ${project} items to ${projectPath}`)
}

const indexPath = path.join(outputDir, 'index.json')
const existingIndex = fs.existsSync(indexPath)
  ? JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  : { projects: [] }
const index = {
  projects: existingIndex.projects || [],
  stats,
  total: allComponents.length,
  components: allComponents.map((item) => ({
    id: item.id,
    project: item.project,
    name: item.name,
    category: item.category,
    style: item.style,
    techStack: item.techStack,
    description: item.description,
    language: item.codeSnippet.language,
  })),
}
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
console.log(`Saved index to ${indexPath}`)
