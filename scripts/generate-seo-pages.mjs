#!/usr/bin/env node
/**
 * generate-seo-pages.mjs — build-time static SEO page generator.
 *
 * Why this exists
 * ---------------
 * The site is a single-route CSR SPA: `/official`, `/components`, `/showcases` and every
 * component detail live in component state, so search engines only ever see one empty
 * `#root`. This script materialises the catalogue (projects / categories / components) into
 * real static HTML documents that any crawler can read without executing JavaScript.
 *
 * Design notes (see docs/SEO_TIER2_DESIGN.md)
 * -------------------------------------------
 * - Runs AFTER `vite build`, writing into `dist/`.
 * - No Chromium (Cloudflare Pages build images have none) and no React SSR — plain templates.
 * - Pages use their own stylesheet `/seo-pages.css` rather than the app's compiled Tailwind
 *   CSS, because Tailwind v4 only emits utilities it finds in scanned source files.
 * - Data comes from `public/data/index.json` (the real runtime catalogue) and
 *   `public/data/<project>.json` (per-component source code). The 29 MB
 *   `data-src/components.json` split intermediate is deliberately NOT read here --
 *   and deliberately lives outside `public/` so it is never shipped as an asset.
 * - Coverage: every component with a `ready` preview and a non-empty code snippet.
 *
 * Outputs
 * -------
 *   dist/projects/<projectId>/index.html
 *   dist/categories/<category>/index.html      (only categories with >= CATEGORY_MIN entries)
 *   dist/components/<componentId>/index.html
 *   dist/404.html
 *   dist/sitemap.xml (sitemap index → sitemap-pages/projects/categories/components.xml)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const DIST = path.join(ROOT, 'dist')

const SITE = 'https://fxlab.craftisle.com'
const CATEGORY_MIN = 2
const MAX_CARDS_PER_PAGE = 150
const MAX_CODE_LINES = 150
const MAX_CARDS_IN_PROJECT = 150

const started = Date.now()
const log = (...a) => console.log('[seo-pages]', ...a)

// ────────────────────────────────────────────────────────────── helpers

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** JSON-LD must not be able to break out of the <script> element. */
function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function clip(text, max) {
  const s = String(text ?? '').trim()
  if (s.length <= max) return s
  return s.slice(0, max - 1).replace(/[\s,;:.-]+$/, '') + '…'
}

/**
 * Cloudflare Pages serves a generated page from `<slug>/index.html` at `<slug>/`
 * and answers the slash-less form with a 308. Canonical, sitemap and every
 * internal link must therefore use the trailing-slash form: otherwise each URL
 * pays a redirect and, worse, the canonical points at a redirect target instead
 * of at the page itself. Verified live 2026-09-20: `/components/at-faq` -> 308,
 * `/components/at-faq/` -> 200.
 */
function slugPath(part) {
  if (!part || part === '/') return '/'
  return `/${String(part).replace(/^\/+|\/+$/g, '')}/`
}
const slugUrl = (part) => `${SITE}${slugPath(part)}`

/**
 * Build a <title> that is never cut mid-phrase.
 *
 * `clip()` alone produces titles ending in an ellipsis, which reads as broken in
 * SERPs and social cards. Instead, try the richest variant first and fall back to
 * progressively shorter suffixes, so long component names lose their boilerplate
 * rather than their meaning. Only a base that is itself over budget gets clipped.
 */
function fitTitle(base, suffixes = [], max = 68) {
  const b = String(base ?? '').trim()
  for (const suffix of suffixes) {
    const candidate = suffix ? `${b} — ${suffix}` : b
    if (candidate.length <= max) return candidate
  }
  return clip(b, max)
}

function titleCase(slug) {
  return String(slug ?? '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function prettyCategory(slug) {
  const s = String(slug ?? 'ui').replace(/-/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Uiverse components embed author-supplied "Tags: ..." comments inside their source.
 * These are real, per-component micro-keywords (e.g. "ripple, glow, hover effect"),
 * far more specific than the shared category phrase — using them differentiates the
 * 3.8k Uiverse component pages instead of repeating one template across the whole set.
 * Other libraries carry no such comments, so they keep their existing category+tech path.
 */
const TAG_STOPWORDS = new Set([
  'button', 'buttons', 'css', 'html', 'ui', 'uiverse', 'hover', 'hoverable',
  'simple', 'basic', 'pure', 'pure-css', 'tailwind', 'tailwindcss', 'javascript',
  'js', 'react', 'web', 'website', 'component', 'components', 'animation',
  'animated', 'card', 'cards', 'input', 'inputs', 'loader', 'loading', 'form',
  'forms', 'icon', 'icons', 'menu', 'style', 'styles', 'custom', 'use', 'cute',
  'small', 'nice', 'beautiful', 'cool', 'new', 'top', 'best', 'with', 'and',
  'hover button', 'rounded button', 'social media', 'social',
])

function extractAuthorTags(source) {
  if (!source) return []
  const m = String(source).match(/Tags:\s*([^*]+)/i)
  if (!m) return []
  // Some Uiverse comments are `<!-- ... Tags: a, b, c -->` followed immediately by HTML;
  // cut at the HTML-comment close so markup fragments never leak into the keyword pool.
  const body = m[1].split('-->')[0]
  const seen = new Set()
  const out = []
  for (const raw of body.split(/[,\n]/)) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, ' ')
    const norm = t.replace(/button$/, '').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' ')
    if (norm.length < 3 || /^\d/.test(norm) || TAG_STOPWORDS.has(norm) || seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
    if (out.length >= 5) break
  }
  return out
}

const KIND_LABEL = {
  'html-live': 'Live Preview',
  'react-generated': 'React Live',
  'media-video': 'Video Demo',
  'media-image': 'Image Demo',
  'js-demo': 'JS Demo',
  'official-demo': 'Official Demo',
  'official-showcase': 'Showcase',
}

/**
 * The catalogue ships auto-generated one-liners such as
 * "animatedContentCode animation component". Emitting those verbatim across thousands of
 * pages would look like scaled template content, so descriptions are re-synthesised from the
 * real fields (name / category / tech stack / project) with five rotating structures keyed by
 * a stable hash — differentiated, still 100% factual.
 */
function synthDescription(component, projectName) {
  const name = component.name || 'This component'
  const cat = prettyCategory(component.category)
  const tech = (component.techStack || []).slice(0, 2).join(' and ') || 'modern web technologies'
  const templates = [
    `${name} is an open-source ${cat.toLowerCase()} component from ${projectName}, built with ${tech}. Preview it live and copy the full source into your own project.`,
    `Copy-ready ${cat.toLowerCase()} built with ${tech}, part of the ${projectName} library. ${name} ships with a live preview and the complete source snippet.`,
    `${name} from ${projectName} — a ${cat.toLowerCase()} implemented with ${tech}. Inspect the live demo, read the source, and drop it straight into your codebase.`,
    `Looking for a ${cat.toLowerCase()}? ${name} by ${projectName} is written in ${tech} and comes with a live preview plus copy-ready source code.`,
    `${name} is a ${cat.toLowerCase()} in the ${projectName} collection (${tech}), published with a live preview and the full source snippet for reuse.`,
  ]
  return templates[hash(component.id) % templates.length]
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writePage(relPath, html) {
  const full = path.join(DIST, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, html, 'utf8')
}

/** Parse the plain object-literal array out of src/data/projects.ts (avoids a TS toolchain). */
function loadProjectMeta() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'projects.ts'), 'utf8')
  const head = src.split('export const allTechStacks')[0]
  const eq = head.indexOf('=')
  const start = head.indexOf('[', eq)
  const end = head.lastIndexOf(']')
  if (eq < 0 || start < 0 || end < start) {
    throw new Error('Could not locate the `projects` array literal in src/data/projects.ts')
  }
  const value = new Function(`return ${head.slice(start, end + 1)}`)()
  if (!Array.isArray(value) || value.length < 5) {
    throw new Error('Parsed `projects` array looks wrong; refusing to generate pages')
  }
  return value
}

// ────────────────────────────────────────────────────────────── shell

const SHELL_CSS = '/seo-pages.css'

function shell({ title, description, canonical, jsonLdBlocks, breadcrumbs, body, ogImage, robots }) {
  // 单语言站点的 hreflang 信号：告知 Google 本页是该语言的唯一版本（en + x-default 指同一页）
  const hreflang =
    typeof canonical === 'string' && canonical.startsWith(SITE)
      ? `<link rel="alternate" hreflang="en" href="${esc(canonical)}">
<link rel="alternate" hreflang="x-default" href="${esc(canonical)}">`
      : ''
  const og = ogImage || `${SITE}/og-image.png`
  const rob = robots || 'index, follow, max-image-preview:large'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${hreflang}
<meta name="robots" content="${esc(rob)}">
<meta name="theme-color" content="#ff4d00">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${SHELL_CSS}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Frontend Design Gallery">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Frontend Design Gallery — open-source UI components and animations">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(og)}">
${jsonLdBlocks.map((b) => `<script type="application/ld+json">${jsonLd(b)}</script>`).join('\n')}
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/"><span class="dot"></span>Frontend Design Gallery</a>
    <nav class="topnav">
      <a href="/components/">Components</a>
      <a href="/categories/buttons/">Categories</a>
      <a href="/showcases/">Showcases</a>
    </nav>
  </div>
</header>
<div class="wrap">
${breadcrumbs}
${body}
</div>
<footer class="foot">
  <div class="wrap">
    <p>Frontend Design Gallery — open-source UI components, animations and design demos with live previews and copy-ready code.</p>
    <div class="row">
      <a href="/">Gallery home</a>
      <a href="/components/">Browse components</a>
      ${FOOTER_PROJECT_NAV}
      <a href="https://github.com/yysam123456-source/frontend-design-portal">GitHub</a>
    </div>
  </div>
</footer>
</body>
</html>
`
}

function crumbsHtml(items) {
  const lis = items
    .map((it) => (it.href ? `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>` : `<li>${esc(it.label)}</li>`))
    .join('')
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`
}

function crumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${SITE}${it.href}` } : {}),
    })),
  }
}

function cardHtml(component, record) {
  const kind = record ? KIND_LABEL[record.kind] || 'Preview' : 'Source'
  const desc = synthDescription(component, '')
  return `<a class="card" href="/components/${esc(component.id)}/">
  <h3>${esc(component.name)}</h3>
  <p class="meta">${esc(prettyCategory(component.category))}</p>
  <p class="desc">${esc(desc)}</p>
  <span class="kind">${esc(kind)}</span>
</a>`
}

// ────────────────────────────────────────────────────────────── load data

log('reading catalogue…')
const index = readJson(path.join(DATA_DIR, 'index.json'))
const allComponents = Array.isArray(index.components) ? index.components : []
const projects = loadProjectMeta()
const projectById = new Map(projects.map((p) => [p.id, p]))

/**
 * Site-wide footer nav listing every source project.
 *
 * Generated pages are reached mostly by search, so this is the only reliable way
 * for a project page to acquire an inbound link. Without it, a project whose
 * components are all ineligible (e.g. pixijs, which has no ready preview) would
 * be an orphan that nothing links to and no crawler would ever find.
 */
const FOOTER_PROJECT_NAV = projects
  .map((p) => `<a href="/projects/${esc(p.id)}/">${esc(p.name)}</a>`)
  .join('\n      ')

const manifest = readJson(path.join(DATA_DIR, 'preview-manifest.json'))
// 逐页长尾词映射：源自真实搜索引擎建议词（见 seo-keywords.json），驱动分类页/项目页/组件页的
// title 与 description 融入真实搜索词，避免全站模板化标题。
const KEYWORDS = readJson(path.join(__dirname, 'seo-keywords.json'))
const manifestRecords = manifest.records || {}
const recordById = new Map(
  (Array.isArray(manifestRecords)
    ? manifestRecords
    : Object.entries(manifestRecords).map(([id, v]) => ({ id, ...v }))
  ).map((r) => [r.id, r])
)

const byId = new Map(allComponents.map((c) => [c.id, c]))

// category → component ids (for category pages + sibling links)
const byCategory = new Map()
for (const c of allComponents) {
  const key = c.category || 'ui'
  if (!byCategory.has(key)) byCategory.set(key, [])
  byCategory.get(key).push(c.id)
}

// project → component ids
const byProject = new Map()
for (const c of allComponents) {
  const key = c.project
  if (!byProject.has(key)) byProject.set(key, [])
  byProject.get(key).push(c.id)
}

// eligibility: ready preview + code snippet present
const eligibleByProject = new Map()
const perProjectCode = new Map() // project → Map(id → codeSnippet)
let eligibleTotal = 0
let skippedNoPreview = 0
let skippedNoCode = 0
const keptIds = new Set()

for (const project of projects) {
  const file = path.join(DATA_DIR, `${project.id}.json`)
  let entries = []
  if (fs.existsSync(file)) {
    const parsed = readJson(file)
    entries = Array.isArray(parsed) ? parsed : parsed.components || []
  }
  const codeMap = new Map()
  for (const e of entries) {
    if (e && e.id && e.codeSnippet && String(e.codeSnippet.source || '').trim()) {
      codeMap.set(e.id, e.codeSnippet)
    }
  }
  perProjectCode.set(project.id, codeMap)

  const ids = (byProject.get(project.id) || []).filter((id) => {
    const rec = recordById.get(id)
    if (!rec || rec.status !== 'ready') {
      skippedNoPreview++
      return false
    }
    if (!codeMap.has(id)) {
      skippedNoCode++
      return false
    }
    return true
  })
  eligibleByProject.set(project.id, ids)
  ids.forEach((id) => keptIds.add(id))
  eligibleTotal += ids.length
  log(`  ${project.id.padEnd(16)} eligible ${String(ids.length).padStart(5)} / ${String((byProject.get(project.id) || []).length).padStart(5)}`)
}

log(`eligible components: ${eligibleTotal} (skipped: ${skippedNoPreview} no ready preview, ${skippedNoCode} no code)`)

// ────────────────────────────────────────────────────────────── project pages

log('generating project pages…')
let projectPageCount = 0
for (const project of projects) {
  const ids = eligibleByProject.get(project.id) || []
  const url = slugUrl(`projects/${project.id}`)
  const canonical = `/projects/${project.id}`
  const kw = KEYWORDS.projects?.[project.id] || {}
  const title = fitTitle(project.name, [
    `${kw.kw || 'open-source UI'} — live previews`,
    `${ids.length} open-source components`,
    'open-source components',
    'components',
  ])
  const description = clip(
    `${project.description} Browse all ${ids.length} ${project.name} components with live previews and copy-ready source code${
      kw.related?.length ? ` — ${kw.related.slice(0, 2).join(', ')}.` : '.'
    }`,
    300
  )

  const shown = ids.slice(0, MAX_CARDS_IN_PROJECT)
  const cards = shown
    .map((id) => {
      const c = byId.get(id)
      return c ? cardHtml(c, recordById.get(id)) : ''
    })
    .filter(Boolean)
    .join('\n')

  const styleCounts = new Map()
  for (const id of ids) {
    const c = byId.get(id)
    for (const s of c?.style || []) styleCounts.set(s, (styleCounts.get(s) || 0) + 1)
  }
  const topStyles = [...styleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, n]) => `${s} (${n})`)

  const body = `
<div class="hero">
  <p class="eyebrow">Source project</p>
  <h1>${esc(project.name)} components</h1>
  <p class="lede">${esc(project.description)}${kw.related?.length ? ` Perfect for ${esc(kw.related.slice(0, 2).join(' and '))} use cases.` : ''}</p>
  <div class="tags">
    ${(project.techStack || []).map((t) => `<span class="tag tag-accent">${esc(t)}</span>`).join('')}
    ${(project.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
  </div>
  <div class="stats">
    <div class="stat"><div class="n">${ids.length.toLocaleString()}</div><div class="l">Components</div></div>
    <div class="stat"><div class="n">${esc(titleCase(project.category))}</div><div class="l">Category</div></div>
  </div>
  <div class="actions">
    <a class="btn btn-primary" href="/components/">Browse all in gallery</a>
    <a class="btn" href="${esc(project.demoBaseUrl)}" rel="noopener">Official site</a>
    <a class="btn" href="${esc(project.github)}" rel="noopener">GitHub repository</a>
  </div>
</div>

<section class="section">
  <h2>About ${esc(project.name)}</h2>
  <p>${esc(project.description)}</p>
  <p>
    We mirror ${ids.length.toLocaleString()} ready-to-copy components from this project${
      topStyles.length ? `, spanning ${esc(topStyles.join(', '))}` : ''
    } — each with a live preview and the complete source snippet, so you can evaluate and reuse them without leaving the gallery.
  </p>
</section>

<section class="section">
  <h2>${esc(project.name)} components (${shown.length}${ids.length > shown.length ? ` of ${ids.length}` : ''})</h2>
  <div class="grid">${cards}</div>
</section>

<section class="section">
  <h2>Related categories</h2>
  <div class="tags">
    ${[...new Set(shown.map((id) => byId.get(id)?.category).filter(Boolean))]
      .slice(0, 14)
      .map((cat) =>
        (byCategory.get(cat) || []).length >= CATEGORY_MIN
          ? `<a class="tag" href="/categories/${esc(cat)}/">${esc(prettyCategory(cat))}</a>`
          : `<span class="tag">${esc(prettyCategory(cat))}</span>`
      )
      .join('')}
  </div>
</section>`

  const breadcrumbs = crumbsHtml([
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/components/' },
    { label: project.name },
  ])

  writePage(
    `projects/${project.id}/index.html`,
    shell({
      title,
      description: clip(description, 155),
      canonical: url,
      breadcrumbs,
      jsonLdBlocks: [
        crumbLd([
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/components/' },
          { label: project.name },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${project.name} components`,
          url,
          description: project.description,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: ids.length,
            itemListElement: shown.slice(0, 50).map((id, i) => {
              const c = byId.get(id)
              return {
                '@type': 'ListItem',
                position: i + 1,
                name: c?.name,
                url: slugUrl(`components/${id}`),
              }
            }),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: project.name,
          description: project.description,
          codeRepository: project.github,
          url: project.demoBaseUrl,
          programmingLanguage: (project.techStack || []).join(', '),
        },
      ],
      body,
    })
  )
  projectPageCount++
}

// ────────────────────────────────────────────────────────────── category pages

log('generating category pages…')
const categories = [...byCategory.entries()]
  .map(([cat, ids]) => [cat, ids.filter((id) => keptIds.has(id))])
  .filter(([, ids]) => ids.length >= CATEGORY_MIN)
  .sort((a, b) => b[1].length - a[1].length)

let categoryPageCount = 0
for (const [cat, ids] of categories) {
  // Only components that actually have a generated page may appear on the category
  // page — otherwise cards would point at URLs that don't exist (dead outbound links).
  const kept = ids.filter((id) => keptIds.has(id))
  const url = slugUrl(`categories/${cat}`)
  const label = prettyCategory(cat)
  const kw = KEYWORDS.categories?.[cat] || {}
  const title = fitTitle(label, [
    `${kw.titleKw || 'open-source UI examples'} with live previews`,
    `${kept.length} open-source ${kw.titleKw || 'UI'} examples`,
    `${kept.length} open-source UI examples`,
    'open-source UI examples',
  ])
  const description = clip(
    `Browse ${kept.length} open-source ${label.toLowerCase()} components with live previews and copy-ready source code${
      kw.related?.length ? `, including ${kw.related.slice(0, 4).join(', ')}.` : '.'
    } Sourced from React Bits, Uiverse, Animata, Anime.js and more.`,
    300
  )
  const shown = kept.slice(0, MAX_CARDS_PER_PAGE)

  const srcProjects = [...new Set(kept.map((id) => byId.get(id)?.project).filter(Boolean))]
  const srcNames = srcProjects.length === 1 ? srcProjects[0] : srcProjects.slice(0, 5).join(', ') + (srcProjects.length > 5 ? ' and more' : '')

  const faqs = [
    {
      q: `How do I use ${kw.kw || label.toLowerCase()} components?`,
      a: `Copy the code block on any ${label.toLowerCase()} card in this gallery, paste it into your own page, and adjust class names to match your design system. Every component ships with a live preview so you can see the result before you paste.`,
    },
    {
      q: `Are these ${label.toLowerCase()} components free to use?`,
      a: `Yes. Everything in the gallery is open-source, sourced from Uiverse, React Bits, Animata, Anime.js, Eldora UI and other public libraries, and ships with copy-ready HTML, CSS or React code.`,
    },
    {
      q: `What kinds of ${label.toLowerCase()} are available?`,
      a: `The collection covers ${
        kw.related?.length ? kw.related.slice(0, 4).join(', ') : label.toLowerCase()
      } and more — every entry with a live preview and the full source code.`,
    },
  ]

  const body = `
<div class="hero">
  <p class="eyebrow">Category</p>
  <h1>${esc(label)} components</h1>
  <p class="lede">
    ${kept.length.toLocaleString()} open-source ${esc(label.toLowerCase())} components collected from across the
    gallery. Each entry links to its full source code and live preview.
    ${kw.related?.length ? `Here you will find ${esc(kw.related.slice(0, 4).join(', '))} ready to copy.` : ''}
  </p>
  <div class="stats">
    <div class="stat"><div class="n">${kept.length.toLocaleString()}</div><div class="l">Components</div></div>
    <div class="stat"><div class="n">${new Set(kept.map((id) => byId.get(id)?.project)).size}</div><div class="l">Source projects</div></div>
  </div>
</div>

<section class="section">
  <h2>What you'll find here</h2>
  <p>
    This collection brings together ${kept.length.toLocaleString()} open-source ${esc(label.toLowerCase())} components${
      srcProjects.length ? ` from ${esc(srcNames)}` : ''
    }${
      kw.related?.length ? `, covering ${esc(kw.related.slice(0, 4).join(', '))}` : ''
    }. Every card links to a live preview and the full, copy-ready source code — no registration, no license fee, ready to drop into your own project.
  </p>
</section>

<section class="section">
  <h2>How to use these components</h2>
  <p>
    Open the preview, copy the code block, and paste it into your own HTML, CSS or React project. Most entries are self-contained — adjust class names, colors and spacing to match your design system and you are done. For framework entries, install the listed dependencies and drop the component in as-is.
  </p>
</section>

<section class="section">
  <h2>${esc(label)} components (${shown.length}${kept.length > shown.length ? ` of ${kept.length}` : ''})</h2>
  <div class="grid">
    ${shown
      .map((id) => {
        const c = byId.get(id)
        return c ? cardHtml(c, recordById.get(id)) : ''
      })
      .filter(Boolean)
      .join('\n')}
  </div>
</section>

<section class="section">
  <h2>Other categories</h2>
  <div class="tags">
    ${categories
      .filter(([c]) => c !== cat)
      .map(([c, list]) => `<a class="tag" href="/categories/${esc(c)}/">${esc(prettyCategory(c))} (${list.length})</a>`)
      .join('')}
  </div>
</section>

<section class="section">
  <h2>Frequently asked questions</h2>
  ${faqs
    .map(
      (f) => `<div class="faq"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`
    )
    .join('')}
</section>`

  const breadcrumbs = crumbsHtml([
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/components/' },
    { label },
  ])

  writePage(
    `categories/${cat}/index.html`,
    shell({
      title,
      description: clip(description, 155),
      canonical: url,
      breadcrumbs,
      jsonLdBlocks: [
        crumbLd([
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/components/' },
          { label },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${label} components`,
          url,
          description: clip(description, 300),
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: kept.length,
            itemListElement: shown.slice(0, 50).map((id, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: byId.get(id)?.name,
              url: slugUrl(`components/${id}`),
            })),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
      body,
    })
  )
  categoryPageCount++
}

log(`categories kept: ${categoryPageCount} (threshold >= ${CATEGORY_MIN}); total categories ${byCategory.size}`)

// ────────────────────────────────────────────────────────────── component pages

log('generating component pages…')
let componentPageCount = 0
for (const project of projects) {
  const codeMap = perProjectCode.get(project.id)
  const ids = eligibleByProject.get(project.id) || []
  if (!codeMap) continue

  for (let idx = 0; idx < ids.length; idx++) {
    const id = ids[idx]
    const c = byId.get(id)
    const snippet = codeMap.get(id)
    if (!c || !snippet) continue

    const rec = recordById.get(id)
    const cat = c.category || 'ui'
    const projectMeta = projectById.get(project.id)
    const projectName = projectMeta?.name || titleCase(project.id)
    const catLabel = prettyCategory(cat)

    const catKw = KEYWORDS.categories?.[cat] || {}
    const authorTags = extractAuthorTags(snippet.source)
    const tagPhrase = authorTags.slice(0, 3).join(' ')
    const title = fitTitle(c.name, [
      authorTags.length ? `${tagPhrase} code & preview` : `${catKw.titleKw || catLabel} code & preview`,
      `${catKw.titleKw || catLabel} code & preview`,
      `${projectName} ${catKw.kw || catLabel} code & preview`,
      `${projectName} component code & preview`,
      `${projectName} component`,
      'component code & preview',
      'component',
    ])
    const kwSentence = catKw.related?.length ? ` Ideal for ${catKw.related.slice(0, 2).join(' and ')}.` : ''
    const tagSentence = authorTags.length ? ` Featuring ${authorTags.slice(0, 3).join(', ')}.` : ''
    const description = clip(synthDescription(c, projectName) + tagSentence + kwSentence, 200)

    // Sequential prev/next inside this project. Guarantees every component page receives
    // at least one inbound internal link — orphan pages are effectively undiscoverable and
    // waste crawl budget.
    const prevId = idx > 0 ? ids[idx - 1] : null
    const nextId = idx < ids.length - 1 ? ids[idx + 1] : null

    // Siblings: deterministic spread across the whole category. Taking "the first six"
    // made every page point at the same handful of entries, leaving ~50% of pages orphaned.
    const catMembers = (byCategory.get(cat) || []).filter((x) => x !== id && keptIds.has(x))
    const siblings = []
    if (catMembers.length) {
      const step = Math.max(1, Math.floor(catMembers.length / 9))
      const start = hash(id) % catMembers.length
      for (let k = 0; k < 12 && siblings.length < 9; k++) {
        const pick = catMembers[(start + k * step) % catMembers.length]
        if (pick && !siblings.includes(pick)) siblings.push(pick)
      }
    }

    const codeLines = String(snippet.source).split('\n')
    const shownCode = codeLines.slice(0, MAX_CODE_LINES).join('\n')
    const truncated = codeLines.length > MAX_CODE_LINES

    const deps = Array.isArray(snippet.dependencies) ? snippet.dependencies.filter(Boolean) : []

    const body = `
<div class="hero">
  <p class="eyebrow">${esc(projectName)} · ${esc(catLabel)}</p>
  <h1>${esc(c.name)}</h1>
  <p class="lede">${esc(description)}</p>
  <div class="tags">
    <span class="tag tag-accent">${esc(KIND_LABEL[rec?.kind] || 'Preview')}</span>
    ${(c.techStack || []).map((t) => `<span class="tag tag-accent">${esc(t)}</span>`).join('')}
    ${(c.style || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
    ${deps.map((d) => `<span class="tag">${esc(d)}</span>`).join('')}
  </div>
  <div class="actions">
    <a class="btn btn-primary" href="${esc(c.demoUrl || projectMeta?.demoBaseUrl || '/components')}" rel="noopener">Open live demo</a>
    <a class="btn" href="/projects/${esc(project.id)}/">More ${esc(projectName)} components</a>
    <a class="btn" href="/components/">Browse gallery</a>
  </div>
</div>

<section class="section">
  <h2>Source code</h2>
  <div class="codeblock">
    <div class="codehead"><span>${esc(snippet.language || 'code')}</span><span>${codeLines.length} lines${truncated ? ` · showing first ${MAX_CODE_LINES}` : ''}</span></div>
    <pre><code>${esc(shownCode)}</code></pre>
  </div>
</section>

${
  siblings.length
    ? `<section class="section">
  <h2>Related ${esc(catLabel.toLowerCase())} components</h2>
  <div class="grid">
    ${siblings
      .map((sid) => {
        const sc = byId.get(sid)
        return sc ? cardHtml(sc, recordById.get(sid)) : ''
      })
      .filter(Boolean)
      .join('\n')}
  </div>
</section>`
    : ''
}

${
  prevId || nextId
    ? `<section class="section">
  <h2>More ${esc(projectName)} components</h2>
  <div class="actions">
    ${
      prevId
        ? `<a class="btn" href="/components/${esc(prevId)}/">← ${esc(byId.get(prevId)?.name || 'Previous component')}</a>`
        : ''
    }
    ${
      nextId
        ? `<a class="btn" href="/components/${esc(nextId)}/">${esc(byId.get(nextId)?.name || 'Next component')} →</a>`
        : ''
    }
    <a class="btn" href="/projects/${esc(project.id)}/">All ${esc(projectName)} components</a>
  </div>
</section>`
    : ''
}`

    const crumbItems = [
      { label: 'Home', href: '/' },
      { label: projectName, href: `/projects/${project.id}/` },
      { label: c.name },
    ]

    // 组件页差异化 OG 图：media-image 类组件有真实截图/海报，用它替代全站通用图
    // （图片搜索 + 社交分享卡片差异化；仅 poster 真实存在的页面启用）
    const poster = rec?.media?.poster ? `${SITE}${rec.media.poster}` : undefined

    writePage(
      `components/${id}/index.html`,
      shell({
        title,
        description: clip(description, 155),
        canonical: slugUrl(`components/${id}`),
        ogImage: poster,
        breadcrumbs: crumbsHtml(crumbItems),
        jsonLdBlocks: [
          crumbLd(crumbItems),
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: c.name,
            description: clip(description, 300),
            programmingLanguage: (c.techStack || []).join(', ') || snippet.language,
            codeRepository: projectMeta?.github,
            ...(c.demoUrl ? { url: c.demoUrl } : {}),
            isPartOf: {
              '@type': 'SoftwareSourceCode',
              name: projectName,
              url: slugUrl(`projects/${project.id}`),
            },
          },
          ...(rec?.kind === 'media-image' && poster
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'ImageObject',
                  contentUrl: poster,
                  url: poster,
                  name: c.name,
                  description: clip(description, 300),
                },
              ]
            : []),
        ],
        body,
      })
    )
    componentPageCount++
  }
  perProjectCode.set(project.id, null)
}

// ────────────────────────────────────────────────────────────── 404 + sitemap

const notFound = shell({
  title: '404 — Page not found | Frontend Design Gallery',
  description: 'The page you requested was not found in the Frontend Design Gallery. Browse open-source UI components and animations instead.',
  // 404 页本身不参与索引：noindex；canonical 指向站点根（此前指向 /404 这个并不存在的 URL，
  // 会形成一个指向 404 的 canonical，属于自指式软错误）。
  robots: 'noindex, follow',
  canonical: `${SITE}/`,
  breadcrumbs: crumbsHtml([{ label: 'Home', href: '/' }, { label: 'Page not found' }]),
  jsonLdBlocks: [],
  body: `<div class="hero">
  <p class="eyebrow">Error 404</p>
  <h1>This page does not exist</h1>
  <p class="lede">The URL you requested was not found. It may have been moved, renamed, or never existed. Try browsing the gallery instead.</p>
  <div class="actions">
    <a class="btn btn-primary" href="/">Browse the gallery</a>
    <a class="btn" href="/components/">All components</a>
    <a class="btn" href="/projects/react-bits/">React Bits</a>
    <a class="btn" href="/categories/buttons/">Buttons</a>
  </div>
</div>`,
})
fs.writeFileSync(path.join(DIST, '404.html'), notFound, 'utf8')

// ────────────────────────────────────────────────────────── SPA view shells
//
// `activePage` is derived from the pathname, so the three views are real URLs.
// They need real files: Cloudflare Pages serves a directory at `<dir>/`, and a
// `_redirects` 200-rewrite proved ineffective in production (verified live:
// `/components` answered 308 -> `/`, dumping every deep link on the home view).
//
// Emitting `components/index.html` + `showcases/index.html` makes both paths
// genuine 200 pages. It also lets each carry baked-in per-view metadata, so
// crawlers see the correct title even without running JS -- which client-side
// meta swapping cannot provide.
const SPA_SHELL_SOURCE = path.join(DIST, 'index.html')

const SPA_VIEWS = [
  {
    dir: 'components',
    title: 'Component Gallery — 5,000+ Open-Source UI Components & Animations',
    description:
      'Search and filter 5,000+ open-source frontend components — buttons, cards, loaders, text animations and backgrounds. Every entry has a live preview and copy-ready code.',
  },
  {
    dir: 'showcases',
    title: 'Showcases — Frontend Design Case Studies & Live Demos',
    description:
      'Curated frontend design showcases and full-page demos built with React, Three.js, PixiJS and Tailwind CSS, with live previews and source links.',
  },
]

if (fs.existsSync(SPA_SHELL_SOURCE)) {
  const baseShell = fs.readFileSync(SPA_SHELL_SOURCE, 'utf8')

  for (const view of SPA_VIEWS) {
    const url = slugUrl(view.dir)
    let html = baseShell

    // Point the page at itself rather than at the home view.
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(view.title)}</title>`)
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${esc(view.description)}" />`
    )
    html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(url)}" />`)
    html = html.replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${esc(view.title)}" />`
    )
    html = html.replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${esc(view.description)}" />`
    )
    html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`)
    html = html.replace(
      /<link rel="alternate" hreflang="en" href="[^"]*">/,
      `<link rel="alternate" hreflang="en" href="${esc(url)}">`
    )
    html = html.replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]*">/,
      `<link rel="alternate" hreflang="x-default" href="${esc(url)}">`
    )
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${esc(view.title)}" />`
    )
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${esc(view.description)}" />`
    )
    // The root document's JSON-LD describes the gallery as a whole at `/`.
    // Leaving it here would claim a CollectionPage at a URL that is not its
    // canonical, so drop it; the generated pages carry their own structured data.
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')

    writePage(path.join(view.dir, 'index.html'), html)
    log(`spa view shell : ${slugPath(view.dir)}`)
  }
} else {
  log('WARNING: dist/index.html missing - SPA view shells not written')
}

/**
 * lastmod 派生：sitemap 只应报告内容的真实修改时间。此前每次构建都把全部
 * 5,111 个 URL 的 lastmod 刷新成当天，Google 会认为全站每日变更而反复重抓，
 * 属于明确的反模式。这里改为从每类页面的内容源文件 mtime 派生 ——
 * 源文件不变，lastmod 就不变。
 */
function fileMtime(relPath) {
  try {
    return fs.statSync(path.join(ROOT, relPath)).mtime.toISOString().slice(0, 10)
  } catch {
    return undefined
  }
}

// ────────────────────────────────────────────────────────────── sitemap (sharded)
//
// One flat 5,100-URL sitemap is legal but opaque: Google can't tell which URLs
// changed or which section regressed. Split by section so GSC shows per-shard
// indexing status and re-crawls only the changed shard.

function sitemapDoc(name, entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`
}

function writeSitemapShard(relPath, entries) {
  fs.writeFileSync(path.join(DIST, relPath), sitemapDoc(relPath, entries), 'utf8')
}

// 首页 + 两个 SPA 视图外壳 + 静态 demo 文档：由 dist/index.html / public 文件派生
const pagesShard = []
const indexMtime = fileMtime('dist/index.html')
pagesShard.push({ loc: `${SITE}/`, lastmod: indexMtime })
pagesShard.push({ loc: `${SITE}/components/`, lastmod: indexMtime })
pagesShard.push({ loc: `${SITE}/showcases/`, lastmod: indexMtime })
for (const p of [
  '/kage.html',
  '/landscape.html',
  '/synthralos-halftone.html',
  '/demo-assets/zelda-hyrule-ui/public-showcase/daily-shrine-tracker.html',
  '/demo-assets/zelda-hyrule-ui/public-showcase/finals-boss-rush.html',
  '/demo-assets/zelda-hyrule-ui/public-showcase/june-quest-calendar.html',
  '/demo-assets/zelda-hyrule-ui/public-showcase/shrine-focus-timer.html',
]) {
  pagesShard.push({ loc: `${SITE}${p}`, lastmod: fileMtime(`public${p}`) })
}
writeSitemapShard('sitemap-pages.xml', pagesShard)

// 项目页：元数据源 src/data/projects.ts
const projectsShard = []
const projectsMtime = fileMtime('src/data/projects.ts')
for (const p of projects) {
  projectsShard.push({ loc: slugUrl(`projects/${p.id}`), lastmod: projectsMtime })
}
writeSitemapShard('sitemap-projects.xml', projectsShard)

// 分类页：目录源 public/data/index.json
const categoriesShard = []
const indexDataMtime = fileMtime('public/data/index.json')
for (const [cat] of categories) {
  categoriesShard.push({ loc: slugUrl(`categories/${cat}`), lastmod: indexDataMtime })
}
writeSitemapShard('sitemap-categories.xml', categoriesShard)

// 组件页：所属项目的代码/元数据 JSON
const componentsShard = []
for (const project of projects) {
  const mtime = fileMtime(`public/data/${project.id}.json`)
  for (const id of eligibleByProject.get(project.id) || []) {
    componentsShard.push({ loc: slugUrl(`components/${id}`), lastmod: mtime })
  }
}
writeSitemapShard('sitemap-components.xml', componentsShard)

const shardLastmod = fileMtime('scripts/generate-seo-pages.mjs')
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['sitemap-pages.xml', 'sitemap-projects.xml', 'sitemap-categories.xml', 'sitemap-components.xml']
  .map((s) => `  <sitemap>
    <loc>${SITE}/${s}</loc>${shardLastmod ? `\n    <lastmod>${shardLastmod}</lastmod>` : ''}
  </sitemap>`)
  .join('\n')}
</sitemapindex>
`
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapIndex, 'utf8')

const urls = [...pagesShard, ...projectsShard, ...categoriesShard, ...componentsShard]

// ────────────────────────────────────────────────────────────── report

const elapsed = ((Date.now() - started) / 1000).toFixed(1)
log('──────────────────────────────────────────────')
log(`project pages   : ${projectPageCount}`)
log(`category pages  : ${categoryPageCount}`)
log(`component pages : ${componentPageCount}`)
log(`sitemap urls    : ${urls.length}`)
log(`404 + sitemap   : written`)
log(`elapsed         : ${elapsed}s`)
log('──────────────────────────────────────────────')
