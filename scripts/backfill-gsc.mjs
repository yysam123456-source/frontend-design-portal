// GSC 查询词回填管线
// -------------------
// 用法（等用户从 GSC 导出数据）：
//   Google Search Console → 效果 → 搜索查询 → 筛选页面（可全站）→ 选择"按查询"分组
//   → 右上角"导出" → CSV（或 Data Studio）。把文件放到项目根，命名为 gsc-queries.csv：
//
//   期望列（导出默认顺序）：Query, Clicks, Impressions, CTR, Position
//   （也兼容首行带网页过滤器的两段式导出：脚本自动跳到 Query 表头所在行）
//
//   node scripts/backfill-gsc.mjs [--apply] [--min-impressions 50] [--top-per-category 3]
//
// 默认 dry-run：只打印建议回填，不修改 seo-keywords.json。
// 加 --apply 才真正写入（写入前自动备份 seo-keywords.json.bak）。
//
// 规则：
//   * 只回填 Position <= 10 且有曝光（Impressions >= min）的查询——已在首页附近但
//     尚未被词簇覆盖的词，回填价值最高（说明已能排名，补强描述可推升 CTR/排名）。
//   * 按关键词命中分类 slug（英文）或已知同义词表归类；命中不上的归入 site 级 related。
//   * 每分类 related 最多 6 个，titleKw 不变（避免重排标题破坏已有落地页）。

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const KW_PATH = path.join(__dirname, 'seo-keywords.json')
const CSV_PATH = path.join(ROOT, 'gsc-queries.csv')

// 常见长尾词 → 分类 slug 同义词表（与 index.json category 对齐；未命中的词不会乱入）
const SYNONYMS = {
  accordion: ['accordion', 'collapse', 'expanding section'],
  alert: ['alert', 'notification toast'],
  animation: ['animation', 'animate', 'transition', 'motion', 'moving', 'animated'],
  background: ['background', 'bg', 'wallpaper', 'backdrop'],
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
  hud: ['hud', 'game hud', 'heads up display', 'overlay hud'],
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
  progress: ['progress', 'progress bar', 'loading bar'],
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
  switch: ['switch', 'toggle', 'toggle switch', 'on off'],
  tab: ['tab', 'tabs', 'tab bar'],
  table: ['table', 'data table', 'grid table'],
  tag: ['tag', 'tags', 'chip', 'hashtag'],
  text: ['text', 'typography', 'heading', 'gradient text', 'neon text'],
  timeline: ['timeline', 'vertical timeline', 'time line'],
  timer: ['timer', 'countdown', 'stopwatch', 'clock'],
  toast: ['toast', 'toast notification', 'snackbar'],
  toggle: ['toggle', 'toggle switch'],
  tooltip: ['tooltip', 'tool tip', 'hover tooltip'],
  threejs: ['threejs', 'three js', 'three.js', 'webgl', '3d'],
  ui: ['ui', 'ui element', 'interface', 'component library'],
  waapi: ['web animations api', 'waapi', 'web animation'],
  widget: ['widget', 'widgets', 'gadget'],
}

function classify(query) {
  const q = query.toLowerCase()
  for (const [slug, words] of Object.entries(SYNONYMS)) {
    if (words.some((w) => q.includes(w))) return slug
  }
  return null
}

function parseCsv(text) {
  // 简单 CSV 解析（无引号内换行），跳过 GSC 两段式导出的头部块
  const rows = []
  let inHeader = true
  let headerIdx = -1
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(',').map((c) => c.trim())
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

function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const minImp = Number((args.find((a) => a.startsWith('--min-impressions=')) || '').split('=')[1] || 50)
  const topPer = Number((args.find((a) => a.startsWith('--top-per-category=')) || '').split('=')[1] || 3)

  if (!fs.existsSync(CSV_PATH)) {
    console.log(`[backfill-gsc] gsc-queries.csv not found at ${CSV_PATH}`)
    console.log('  请从 GSC 导出查询词 CSV 放到项目根后重跑。')
    return
  }
  const kw = JSON.parse(fs.readFileSync(KW_PATH, 'utf8'))
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'))
  console.log(`[backfill-gsc] parsed ${rows.length} queries`)

  const interesting = rows.filter((r) => r.position > 0 && r.position <= 10 && r.impressions >= minImp)
  console.log(`[backfill-gsc] candidates: position<=10 & impressions>=${minImp}: ${interesting.length}`)

  const byCat = new Map()
  for (const r of interesting) {
    const slug = classify(r.query)
    if (!slug) continue
    if (!byCat.has(slug)) byCat.set(slug, [])
    byCat.get(slug).push(r)
  }

  const siteRelated = kw.site?.related || []
  let siteAdds = 0
  const perCatAdds = new Map()
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
    if (adds.length) perCatAdds.set(slug, adds)
    // site 级补强：未被分类命中的高曝光词，最多 4 个
    if (siteAdds < 4 && adds.length === 0 && list[0]) {
      const w = list[0].query.toLowerCase()
      if (!existing.has(w) && !siteRelated.includes(w)) {
        siteRelated.push(w)
        siteAdds++
      }
    }
  }

  console.log('── 建议回填（dry-run 预览；--apply 生效）────────────────')
  for (const [slug, adds] of perCatAdds) {
    console.log(`categories.${slug}.related += ${adds.join(' | ')}`)
  }
  if (siteAdds) console.log(`site.related += (${siteAdds} 条未分类高曝光词)`)

  if (!apply) {
    console.log('[backfill-gsc] dry-run 完成，未写文件。加 --apply 生效。')
    return
  }
  fs.copyFileSync(KW_PATH, KW_PATH + '.bak')
  for (const [slug, adds] of perCatAdds) {
    const cat = kw.categories[slug]
    cat.related = [...new Set([...(cat.related || []), ...adds])].slice(0, 6)
  }
  kw.site.related = siteRelated
  fs.writeFileSync(KW_PATH, JSON.stringify(kw, null, 2), 'utf8')
  console.log('[backfill-gsc] 已写入 seo-keywords.json（备份 .bak）')
}

main()
