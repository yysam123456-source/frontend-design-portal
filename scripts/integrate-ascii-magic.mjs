/*
 * Integrate ascii-magic-art (https://github.com/kailashsr38/ascii-magic-art, MIT)
 * into the portal catalogue.
 *
 * Source of truth: the self-hosted copy in public/ascii-magic/ (734 pieces,
 * runtime, lib and categories copied from the upstream repository). This script
 * imports every piece module so constants such as cols: W / rows: H are resolved
 * exactly as the runtime sees them, then writes:
 *
 *   public/data/ascii-magic.json             full entries (code snippet + demo link)
 *   public/data/ascii-magic-categories.json  24 category names and blurbs
 *   public/data/index.json                   summaries, stats, total, project list
 *
 * Run with `node scripts/integrate-ascii-magic.mjs` from the repo root.
 */
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const rootDir = process.cwd()
const piecesDir = path.join(rootDir, 'public', 'ascii-magic', 'pieces')
const dataDir = path.join(rootDir, 'public', 'data')
const PROJECT_ID = 'ascii-magic'
const CATEGORY = 'ascii'
const SOURCE = 'https://github.com/kailashsr38/ascii-magic-art'
const SITE = 'https://www.ascii-magic.com/ascii'
const DNAME = 'ASCII Magic'

// The two photo-based scenes keep the Unsplash License; see NOTICE.
const UNSPLASH_PIECES = {
  'ocean-sunset': 'Ocean Sunset — photo by César Couto (Unsplash)',
  'starry-ridge': 'Starry Ridge — photo by Vincentiu Solomon (Unsplash)',
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function sentence(text) {
  const value = String(text || '').trim()
  if (!value) return ''
  const capital = value[0].toUpperCase() + value.slice(1)
  return capital.endsWith('.') ? capital : `${capital}.`
}

function labelFromCategory(category) {
  return String(category || 'ASCII')
    .split('-')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

const categories = readJson(path.join(rootDir, 'public', 'ascii-magic', 'categories.json'))
const categoryOrder = categories.map((item) => item.id)
const categoryById = new Map(categories.map((item) => [item.id, item]))

const files = fs
  .readdirSync(piecesDir)
  .filter((file) => file.endsWith('.js'))
  .sort()

const pieces = []
for (const file of files) {
  const slug = file.replace(/\.js$/, '')
  const mod = await import(pathToFileURL(path.join(piecesDir, file)).href)
  const meta = mod.meta
  if (!meta || !meta.slug || meta.slug !== slug) {
    throw new Error(`unexpected meta in ${file}: ${meta && meta.slug}`)
  }
  if (!categoryById.has(meta.category)) {
    throw new Error(`unknown category "${meta.category}" in ${file}`)
  }
  if (!Number.isFinite(meta.cols) || !Number.isFinite(meta.rows)) {
    throw new Error(`bad grid in ${file}: ${meta.cols}x${meta.rows}`)
  }
  pieces.push({ slug, meta, square: meta.cell === 'square' })
}

pieces.sort((a, b) => {
  const order = categoryOrder.indexOf(a.meta.category) - categoryOrder.indexOf(b.meta.category)
  if (order !== 0) return order
  return a.slug.localeCompare(b.slug)
})

const categoryCounts = {}
for (const piece of pieces) {
  categoryCounts[piece.meta.category] = (categoryCounts[piece.meta.category] || 0) + 1
}

const entries = pieces.map(({ slug, meta, square }) => {
  const id = `${PROJECT_ID}-${slug}`
  const category = categoryById.get(meta.category)
  const categoryName = category?.name || labelFromCategory(meta.category)
  const photo = UNSPLASH_PIECES[slug]
  const palette = Boolean(meta.palette)
  const description = [
    sentence(meta.note),
    `An animated ${categoryName} piece from ${DNAME} — one <ascii-magic-art> tag, no build step, MIT licensed.`,
    photo ? `Photo-based scene: ${photo}; image data stays under the Unsplash License (see NOTICE).` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const code = [
    '<script type="module" src="/ascii-magic/runtime/ascii.js"></script>',
    `<style>ascii-magic-art{display:block;font-size:calc((100vw - 48px) / ${meta.cols} / 0.602);line-height:${square ? 1 : 1.05}}</style>`,
    `<ascii-magic-art piece="${slug}"></ascii-magic-art>`,
  ].join('\n')
  return {
    id,
    project: PROJECT_ID,
    name: meta.name || labelFromCategory(slug),
    category: CATEGORY,
    style: ['ascii-art', 'animated', meta.category, palette ? 'canvas' : 'text'],
    techStack: palette
      ? ['JavaScript', 'Web Components', 'Canvas API']
      : ['JavaScript', 'Web Components'],
    description,
    language: 'html',
    demoUrl: `${SITE}/${slug}`,
    // Renderer hints for the ASCII Magic showcase (not part of the shared ComponentEntry contract).
    cols: meta.cols,
    rows: meta.rows,
    fps: meta.fps || 30,
    cell: square ? 1 : 1.66,
    square,
    pieceCategory: meta.category,
    palette,
    defaultLook: meta.look || null,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    license: photo ? 'Unsplash' : 'MIT',
    source: SOURCE,
    codeSnippet: { language: 'html', source: code },
  }
})

const summaries = entries.map(({ id, project, name, category, style, techStack, description, language }) => ({
  id,
  project,
  name,
  category,
  style,
  techStack,
  description,
  language,
}))

writeJson(path.join(dataDir, `${PROJECT_ID}.json`), entries)
writeJson(path.join(dataDir, `${PROJECT_ID}-categories.json`), categories)
console.log(`wrote ${entries.length} ascii-magic entries across ${categories.length} categories`)
console.log(
  categories
    .map((item) => `${item.id} ${categoryCounts[item.id] || 0}`)
    .join(' · ')
)

// ── index.json: replace this project's slice, keep everything else ──────────
const index = readJson(path.join(dataDir, 'index.json'))
const components = (index.components || []).filter((component) => component.project !== PROJECT_ID)
const merged = [...components, ...summaries]

const stats = {}
for (const component of merged) {
  stats[component.project] = (stats[component.project] || 0) + 1
}

writeJson(path.join(dataDir, 'index.json'), {
  ...index,
  projects: [...new Set([...(index.projects || []).filter((id) => id !== PROJECT_ID), PROJECT_ID])],
  stats,
  total: merged.length,
  components: merged,
})
console.log(`index.json now holds ${merged.length} components (${merged.filter((c) => c.category === CATEGORY).length} in the ascii category)`)
