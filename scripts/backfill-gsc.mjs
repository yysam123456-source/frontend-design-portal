// GSC 查询词回填管线
// -------------------
// 用法（等用户从 GSC 导出数据）：
//   Google Search Console → 效果 → 搜索查询 → 选时间段（建议 90 天）→
//   右上角"导出"→ CSV。把导出的文件放到项目根，命名为 gsc-queries.csv；
//   或建一个 gsc-queries/ 文件夹把多次导出的 CSV 全放进去（自动合并）。
//
//   期望列（导出默认顺序）：Query, Clicks, Impressions, CTR, Position
//   （也兼容首行带网页过滤器的两段式导出：脚本自动跳到 Query 表头所在行）
//
//   node scripts/backfill-gsc.mjs                  # dry-run，只预览建议
//   node scripts/backfill-gsc.mjs --apply          # 真正写入（自动备份）
//   node scripts/backfill-gsc.mjs --apply --min-impressions 100 --top-per-category 4
//
// 规则：
//   * 只回填 Position <= 10 且有曝光（Impressions >= min）的查询——已在首页附近
//     但尚未被词簇覆盖的词，回填价值最高（能排名，补强描述可推升 CTR/排名）。
//   * 项目品牌词（uiverse/zelda/react bits 等）回填到 projects.<id>.related；
//     组件词按同义词表归入 categories.<slug>.related；都未命中归入 site.related。
//   * 每处 related 最多 6~7 个，titleKw 不变（避免重排标题破坏已有落地页）。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')
const KW_PATH = path.join(HERE, 'seo-keywords.json')

// 项目品牌词 → projects.<id>（优先于分类，避免 "uiverse io" 误入通用 ui）
const PROJECT_NAMES = {
  uiverse: ['uiverse'],
  animejs: ['anime js', 'anime.js', 'animejs'],
  'react-bits': ['react bits'],
  animata: ['animata'],
  eldoraui: ['eldora'],
  threeui: ['threeui', 'three ui'],
  'zelda-hyrule-ui': ['zelda', 'botw', 'sheikah', 'hyrule'],
  pixel2motion: ['pixel2motion', 'pixel 2 motion'],
  pixijs: ['pixijs', 'pixi js'],
}

// 组件长尾词 → 分类 slug（与 index.json category 对齐；未命中的词不会乱入）
const SYNONYMS = {
  accordion: ['accordion', 'collapse', 'expanding section'],
  alert: ['alert', 'notification toast'],
  animation: ['animation', 'animate', 'transition', 'motion', 'moving', 'animated'],
  background: ['background', 'animated background', 'wallpaper', 'backdrop'],
  badge: ['badge', 'label chip'],
  banner: ['banner', 'hero banner', 'header banner'],
  bento: ['bento'],
  breadcrumb: ['breadcrumb', 'bread crumbs'],
  button: ['button', 'btn', 'click', 'cta', 'pill'],
  card: ['card', 'cards', 'tile', 'profile card', 'glassmorphism card', 'flip card'],
  carousel: ['carousel', 'slider', 'swiper', 'slideshow', 'marquee'],
  checkbox: ['checkbox', 'check box'],
  container: ['container', 'wrapper', 'layout container'],
  counter: ['counter', 'count up', 'number ticker'],
  divider: ['divider', 'separator', 'wave divider'],
  drawer: ['drawer', 'side panel'],
  draggable: ['draggable', 'drag and drop', 'sortable', 'dnd'],
  dropdown: ['dropdown', 'drop down', 'menu dropdown'],
  easing: ['easing', 'cubic bezier', 'ease'],
  fab: ['fab', 'floating action button'],
  faq: ['faq', 'accordion faq'],
  form: ['form', 'input group', 'contact form', 'login form', 'registration'],
  gallery: ['gallery', 'image grid', 'masonry'],
  gradient: ['gradient', 'conic gradient', 'animated gradient'],
  hero: ['hero', 'hero section', 'landing hero'],
  hover: ['hover', 'hover effect', 'hover state'],
  hud: ['hud', 'game hud', 'heads up display', 'overlay hud', 'health bar'],
  icon: ['icon', 'icons', 'svg icon'],
  input: ['input', 'text field', 'textbox'],
  landing: ['landing page', 'landing'],
  list: ['list', 'list item', 'list group'],
  loader: ['loader', 'loading', 'spinner', 'preloader', 'skeleton', 'loading screen'],
  login: ['login', 'sign in', 'log in', 'signin'],
  map: ['map', 'maps', 'interactive map'],
  menu: ['menu', 'navigation menu', 'nav', 'navbar', 'sidebar menu', 'hamburger'],
  modal: ['modal', 'popup', 'pop up', 'dialog', 'lightbox'],
  navbar: ['navbar', 'nav bar', 'navigation bar', 'header nav'],
  notification: ['notification', 'toast', 'toastify', 'bell'],
  pagination: ['pagination', 'page numbers'],
  parallax: ['parallax', 'scroll parallax'],
  particles: ['particle', 'particles', 'confetti', 'canvas particles'],
  pie: ['pie chart', 'donut'],
  preloader: ['preloader', 'page loader', 'page preloader'],
  progress: ['progress', 'progress bar', 'loading bar', 'progress ring'],
  radio: ['radio button', 'radio'],
  rating: ['rating', 'star rating', 'stars'],
  scroll: ['scroll', 'scroll driven', 'scroll trigger', 'reveal on scroll', 'parallax scroll'],
  search: ['search bar', 'search input', 'search box'],
  section: ['section', 'section divider'],
  sidebar: ['sidebar', 'side nav', 'side navigation'],
  skeleton: ['skeleton', 'skeleton screen', 'placeholder loading'],
  slider: ['slider', 'range slider', 'range input'],
  spinner: ['spinner', 'spinners', 'loading spinner'],
  stagger: ['stagger', 'staggered'],
  stat: ['stat', 'stats', 'statistics', 'metric'],
  stepper: ['stepper', 'steps', 'step indicator', 'wizard'],
  svg: ['svg', 'svg animation', 'inline svg'],
  'toggle-switches': ['toggle', 'toggle switch', 'switch', 'on off'],
  tab: ['tab', 'tabs', 'tab bar'],
  table: ['table', 'data table', 'grid table'],
  tag: ['tag', 'tags', 'chip', 'hashtag'],
  text: ['text', 'typography', 'heading', 'gradient text', 'neon text'],
  timeline: ['timeline', 'vertical timeline', 'time line'],
  timer: ['timer', 'countdown', 'stopwatch', 'clock'],
  toast: ['toast', 'toast notification', 'snackbar'],
  tooltip: ['tooltip', 'tool tip', 'hover tooltip'],
  threejs: ['threejs', 'three js', 'three.js', 'webgl', '3d'],
  'ui-element': ['ui element', 'ui components', 'components library', 'interface', 'component library'],
  waapi: ['web animations api', 'waapi', 'web animation'],
  widget: ['widget', 'widgets', 'gadget'],
  battle: ['battle ui', 'combat ui', 'damage number', 'rpg battle'],
  quest: ['quest', 'quest log', 'quest tracker'],
  scope: ['scope', 'aim', 'crosshair', 'sniper'],
  decorations: ['decoration', 'ornament'],
  graphs: ['graph', 'bar chart', 'gauge chart'],
  titles: ['title screen', 'game title'],
  utilities: ['utility class', 'css helpers'],
  shop: ['shop ui', 'ecommerce ui', 'store ui', 'product card'],
  'feature-cards': ['feature card', 'feature section', 'pricing card'],
  controls: ['controls ui', 'controller ui', 'game controls'],
  css: ['pure css', 'css art', 'css design'],
  chat: ['chat bubble', 'speech bubble', 'chat ui'],
  combobox: ['combobox'],
  footer: ['footer'],
  gradient: ['gradient'],
  rating: ['rating'],
  spinner: ['spinner'],
}

function classify(query) {
  const q = query.toLowerCase()
  for (const [proj, words] of Object.entries(PROJECT_NAMES)) {
    if (words.some((w) => q.includes(w))) return { project: proj }
  }
  for (const [slug, words] of Object.entries(SYNONYMS)) {
    if (words.some((w) => q.includes(w))) return { category: slug }
  }
  return null
}

// 兼容 GSC 导出：Query 偶有引号包裹（内部含逗号时）。只解析带引号的字段。
function parseCsv(text) {
  const rows = []
  let inHeader = true
  let headerIdx = -1
  for (const line of text.split(/\r?\n/)) {
    const cells = splitCsvLine(line)
    if (inHeader) {
      const idx = cells.findIndex((c) => c.toLowerCase() === 'query')
      if (idx >= 0) {
        headerIdx = idx
        inHeader = false
      }
      continue
    }
    if (!cells[headerIdx]) continue
    rows.push({
      query: cells[headerIdx],
      clicks: Number(cells[headerIdx + 1] || 0),
      impressions: Number(cells[headerIdx + 2] || 0),
      ctr: cells[headerIdx + 3],
      position: Number(cells[headerIdx + 4] || 0),
    })
  }
  return rows
}

function splitCsvLine(line) {
  const cells = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) inQ = !inQ
    else if (ch === ',' && !inQ) {
      cells.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  cells.push(cur.trim())
  return cells
}

function loadCsvRows() {
  const single = path.join(ROOT, 'gsc-queries.csv')
  const dir = path.join(ROOT, 'gsc-queries')
  const files = []
  if (fs.existsSync(single)) files.push(single)
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) if (f.toLowerCase().endsWith('.csv')) files.push(path.join(dir, f))
  }
  if (files.length === 0) {
    console.log(`[backfill-gsc] 未找到数据：${single} 或 ${dir}/ 目录（内含 .csv）`)
    console.log('  请先从 GSC 导出查询词 CSV（操作步骤见下方说明）。')
    return []
  }
  const rows = []
  for (const f of files) rows.push(...parseCsv(fs.readFileSync(f, 'utf8')))
  // 多文件/多时段导出可能重复；按 query 去重并保留最大曝光
  const byQ = new Map()
  for (const r of rows) {
    const key = r.query.toLowerCase()
    const prev = byQ.get(key)
    if (!prev || r.impressions > prev.impressions) byQ.set(key, r)
  }
  return [...byQ.values()]
}

function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const minImp = Number((args.find((a) => a.startsWith('--min-impressions=')) || '').split('=')[1] || 50)
  const topPer = Number((args.find((a) => a.startsWith('--top-per-category=')) || '').split('=')[1] || 3)

  const rows = loadCsvRows()
  if (rows.length === 0) return
  const kw = JSON.parse(fs.readFileSync(KW_PATH, 'utf8'))
  console.log(`[backfill-gsc] parsed ${rows.length} unique queries`)

  const interesting = rows.filter((r) => r.position > 0 && r.position <= 10 && r.impressions >= minImp)
  console.log(`[backfill-gsc] candidates: position<=10 & impressions>=${minImp}: ${interesting.length}`)

  const byProject = new Map()
  const byCat = new Map()
  const unmatched = []
  for (const r of interesting) {
    const hit = classify(r.query)
    if (!hit) {
      unmatched.push(r)
      continue
    }
    if (hit.project) {
      if (!byProject.has(hit.project)) byProject.set(hit.project, [])
      byProject.get(hit.project).push(r)
    } else {
      if (!byCat.has(hit.category)) byCat.set(hit.category, [])
      byCat.get(hit.category).push(r)
    }
  }

  const siteRelated = kw.site?.related || []
  const report = []
  for (const [slug, list] of [...byCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const cat = kw.categories?.[slug]
    if (!cat) continue
    const existing = new Set([...new Set([cat.kw, ...(cat.related || [])])])
    const adds = []
    for (const r of list.sort((a, b) => b.clicks - a.clicks)) {
      if (adds.length >= topPer) break
      const w = r.query.toLowerCase()
      if (existing.has(w) || adds.includes(w)) continue
      adds.push(w)
    }
    if (adds.length) {
      report.push(`categories.${slug}.related += ${adds.join(' | ')}`)
      if (apply) cat.related = [...new Set([...(cat.related || []), ...adds])].slice(0, 6)
    }
  }
  for (const [id, list] of [...byProject.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const proj = kw.projects?.[id]
    if (!proj) continue
    const existing = new Set([...new Set([proj.kw, ...(proj.related || [])])])
    const adds = []
    for (const r of list.sort((a, b) => b.clicks - a.clicks)) {
      if (adds.length >= topPer) break
      const w = r.query.toLowerCase()
      if (existing.has(w) || adds.includes(w)) continue
      adds.push(w)
    }
    if (adds.length) {
      report.push(`projects.${id}.related += ${adds.join(' | ')}`)
      if (apply) proj.related = [...new Set([...(proj.related || []), ...adds])].slice(0, 6)
    }
  }
  // site 级补强：未被分类/项目命中的高曝光词，最多 3 个
  let siteAdds = 0
  for (const r of unmatched.sort((a, b) => b.clicks - a.clicks)) {
    if (siteAdds >= 3) break
    const w = r.query.toLowerCase()
    if (siteRelated.includes(w)) continue
    siteRelated.push(w)
    report.push(`site.related += ${w}`)
    siteAdds++
  }

  console.log('── 建议回填' + (apply ? '（已写入）' : '（dry-run 预览；--apply 生效）') + ' ────────────────')
  for (const line of report) console.log(line)
  if (report.length === 0) console.log('  无新词可回填（均已覆盖）。')

  if (!apply) {
    console.log('[backfill-gsc] dry-run 完成，未写文件。加 --apply 生效。')
    return
  }
  fs.copyFileSync(KW_PATH, KW_PATH + '.bak')
  if (siteAdds) kw.site.related = siteRelated.slice(0, 7)
  fs.writeFileSync(KW_PATH, JSON.stringify(kw, null, 2), 'utf8')
  console.log('[backfill-gsc] 已写入 seo-keywords.json（原文件备份为 .bak）。重跑 npm run build 生效。')
}

main()
