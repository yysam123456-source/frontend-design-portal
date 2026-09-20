import fs from 'fs'
import path from 'path'

// NOTE: keep this file ASCII-only. On Windows PowerShell 5.1, non-ASCII bytes in
// a UTF-8 file without BOM get decoded as ANSI and can swallow the next line.

// Post-build QA for the generated SEO pages. Run after `npm run build`:
//   node scripts/verify-seo-pages.mjs
// Exits non-zero when a hard requirement fails, so it can gate CI.

const rootDir = path.join(import.meta.dirname, '..')
const distDir = path.join(rootDir, 'dist')
const SITE = 'https://fxlab.craftisle.com'
const PAGE_ROOTS = ['components', 'projects', 'categories']

if (!fs.existsSync(distDir)) {
  console.error('[verify] dist/ not found - run `npm run build` first')
  process.exit(1)
}

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkHtml(full, out)
    else if (entry.name === 'index.html') out.push(full)
  }
  return out
}

const allHtml = walkHtml(distDir)

// Collect generated pages and every internal link they contain.
const pages = []
const inbound = new Map()

// `components` and `showcases` are SPA view shells, not generated content pages;
// they are validated separately below.
const SPA_SHELLS = new Set(['components', 'showcases'])

for (const file of allHtml) {
  const rel = path.relative(distDir, file).split(path.sep).join('/')
  const slug = rel.replace(/\/index\.html$/, '')
  const root = slug.split('/')[0]
  const isGenerated = PAGE_ROOTS.includes(root) && !SPA_SHELLS.has(slug)
  if (isGenerated) pages.push({ slug, file })
  inbound.set('/' + slug, 0)
}

for (const file of allHtml) {
  const html = fs.readFileSync(file, 'utf8')
  const hrefs = html.match(/href="(\/[^"#?]*)"/g) || []
  for (const raw of hrefs) {
    let href = raw.slice(6, -1)
    if (href !== '/' && href.endsWith('/')) href = href.slice(0, -1)
    if (inbound.has(href)) inbound.set(href, inbound.get(href) + 1)
  }
}

// --- orphan analysis -------------------------------------------------------
const orphans = pages.filter((p) => (inbound.get('/' + p.slug) || 0) === 0)
const counts = pages.map((p) => inbound.get('/' + p.slug) || 0).sort((a, b) => a - b)
const median = counts[Math.floor(counts.length / 2)] || 0

// --- per-page integrity ----------------------------------------------------
const failures = []
const sampleStep = Math.max(1, Math.floor(pages.length / 120))
const sample = pages.filter((_, i) => i % sampleStep === 0)

let titleLong = 0
let descLong = 0
for (const { slug, file } of sample) {
  const html = fs.readFileSync(file, 'utf8')
  // Cloudflare serves the page at `<slug>/`; the canonical must say so.
  const url = `${SITE}/${slug}/`

  const h1 = (html.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) failures.push(`${slug}: expected 1 <h1>, found ${h1}`)

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)
  if (!canonical) failures.push(`${slug}: missing canonical`)
  else if (canonical[1] !== url) failures.push(`${slug}: canonical=${canonical[1]} expected ${url}`)

  const title = html.match(/<title>([^<]*)<\/title>/)
  if (!title) failures.push(`${slug}: missing <title>`)
  else if (title[1].length > 72) titleLong++
  if (title && /[\u2026]$/.test(title[1])) failures.push(`${slug}: title truncated with ellipsis`)

  const desc = html.match(/<meta name="description" content="([^"]*)"/)
  if (!desc) failures.push(`${slug}: missing meta description`)
  else if (desc[1].length > 160) descLong++

  const ldBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []
  if (ldBlocks.length === 0) failures.push(`${slug}: no JSON-LD`)
  for (const block of ldBlocks) {
    const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
    try {
      JSON.parse(body)
    } catch (e) {
      failures.push(`${slug}: invalid JSON-LD (${e.message})`)
    }
  }

  const links = (html.match(/href="\/(components|projects|categories)\//g) || []).length
  if (links < 3) failures.push(`${slug}: only ${links} internal links (min 3)`)
}

// --- trailing slash / redirect hygiene -------------------------------------
//
// Cloudflare Pages serves a directory at `<dir>/` and 308-redirects the
// slash-less form. Any internal link without the trailing slash therefore costs
// a redirect hop, and a canonical without it points at a redirect target
// instead of at the page. Verified live 2026-09-20 on /components/at-faq.
const FILE_LIKE = /\.[a-z0-9]{2,5}$/i
const slashlessLinks = new Map()
for (const file of allHtml) {
  const rel = path.relative(distDir, file).split(path.sep).join('/')
  const html = fs.readFileSync(file, 'utf8')
  for (const raw of html.match(/href="(\/[^"#?]*)"/g) || []) {
    const href = raw.slice(6, -1)
    if (href === '/' || href.endsWith('/') || FILE_LIKE.test(href)) continue
    if (!slashlessLinks.has(href)) slashlessLinks.set(href, rel)
  }
}

// --- SPA view shells -------------------------------------------------------
const shellResults = []
for (const dir of SPA_SHELLS) {
  const file = path.join(distDir, dir, 'index.html')
  if (!fs.existsSync(file)) {
    shellResults.push(`${dir}: MISSING`)
    continue
  }
  const html = fs.readFileSync(file, 'utf8')
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)
  const expected = `${SITE}/${dir}/`
  shellResults.push(
    canonical && canonical[1] === expected ? `${dir}: ok` : `${dir}: canonical=${canonical ? canonical[1] : 'none'}`
  )
}

// --- sitemap ---------------------------------------------------------------
const sitemapPath = path.join(distDir, 'sitemap.xml')
let sitemapUrls = []
if (fs.existsSync(sitemapPath)) {
  sitemapUrls = (fs.readFileSync(sitemapPath, 'utf8').match(/<loc>([^<]+)<\/loc>/g) || []).map((s) =>
    s.slice(5, -6)
  )
}

const fileCount = allHtml.length + countOtherFiles(distDir)
function countOtherFiles(dir) {
  let n = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) n += countOtherFiles(full)
    else if (entry.name !== 'index.html') n++
  }
  return n
}

// --- report ----------------------------------------------------------------
const uniqueUrls = new Set(sitemapUrls)
const offsite = sitemapUrls.filter((u) => !u.startsWith(SITE))

console.log('=== SEO page verification ===')
console.log(`generated pages      : ${pages.length}`)
console.log(`inbound links        : min=${counts[0]} median=${median} max=${counts[counts.length - 1]}`)
console.log(`orphan pages         : ${orphans.length}`)
console.log(`sampled for integrity: ${sample.length}`)
console.log(`sitemap urls         : ${sitemapUrls.length} (unique ${uniqueUrls.size})`)
console.log(`sitemap offsite      : ${offsite.length}`)
console.log(`dist total files     : ${fileCount} / 20000`)
console.log(`titles > 72 chars    : ${titleLong} (of sample)`)
console.log(`descriptions > 160   : ${descLong} (of sample)`)
console.log(`SPA view shells      : ${shellResults.join(' | ')}`)
console.log(`slash-less links     : ${slashlessLinks.size} (each would 308-redirect)`)

const hardFailures = []
if (orphans.length > 0) hardFailures.push(`${orphans.length} orphan pages`)
if (failures.length > 0) hardFailures.push(`${failures.length} page integrity failures`)
if (sitemapUrls.length !== uniqueUrls.size) hardFailures.push('duplicate sitemap urls')
if (offsite.length > 0) hardFailures.push('sitemap contains non-fxlab urls')
if (fileCount >= 20000) hardFailures.push(`dist exceeds Cloudflare Pages 20000-file limit (${fileCount})`)
if (slashlessLinks.size > 0) hardFailures.push(`${slashlessLinks.size} internal links missing a trailing slash`)
if (shellResults.some((r) => !r.endsWith(': ok'))) hardFailures.push('SPA view shell problem')
if (sitemapUrls.some((u) => u !== `${SITE}/` && !u.endsWith('/') && !FILE_LIKE.test(u)))
  hardFailures.push('sitemap contains slash-less urls')

if (slashlessLinks.size) {
  console.log('\nfirst slash-less links:')
  for (const [href, from] of [...slashlessLinks].slice(0, 10)) console.log(`  ${href}  (in ${from})`)
}

if (orphans.length) {
  console.log('\nfirst orphans:')
  for (const o of orphans.slice(0, 10)) console.log('  ' + o.slug)
}
if (failures.length) {
  console.log('\nfirst failures:')
  for (const f of failures.slice(0, 15)) console.log('  ' + f)
}

if (hardFailures.length) {
  console.error('\nFAIL: ' + hardFailures.join('; '))
  process.exit(1)
}
console.log('\nPASS: all hard requirements met')
