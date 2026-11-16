/*
 * Integrate Shaders (https://github.com/shader-effects-inc/shaders, MIT) into the
 * portal catalogue.
 *
 * The upstream clone is kept outside the repository (e.g. /tmp/shaders-upstream)
 * because the portal's build treats repos/ as a local-only source tree. This
 * script writes committed data and assets:
 *
 *   public/data/shaders.json          200 component entries + 8 curated demos + overview
 *   public/data/index.json            summaries, project list, stats
 *   public/data/preview-manifest.*    cover-based preview records
 *   public/shaders/covers/            upstream cover images
 *
 * Run with:
 *   SHADERS_ROOT=/tmp/shaders-upstream node scripts/integrate-shaders.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')
const UPSTREAM = process.env.SHADERS_ROOT || '/tmp/shaders-upstream'
const SHADER_SRC = path.join(UPSTREAM, 'packages', 'core', 'src', 'shaders')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const GENERATED_DIR = path.join(ROOT, 'src', 'generated')
const ASSET_DIR = path.join(ROOT, 'public', 'shaders')
const COVER_DIR = path.join(ASSET_DIR, 'covers')
const PLAYGROUND = path.join(ASSET_DIR, 'playground.html')

const PROJECT = 'shaders'
const SHOWCASE_COVER = '/shaders/showcase-cover.jpg'
const curatedCover = (id) => {
  const demo = CURATED_DEMOS.find((item) => `sh-demo-${kebab(item.folder)}` === id)
  return demo ? `${demo.folder}.jpg` : 'Aurora.jpg'
}
const CURATED_DEMOS = [
  {folder: 'ChromaFlow', title: 'ChromaFlow — Liquid Color', description: 'A velvety chromatic field that bends around the cursor. One layer, pure color motion.'},
  {folder: 'LiquidMetal', title: 'LiquidMetal — Chrome Bloom', description: 'Molten chrome folds over the shape with a reflective, high-contrast specular sweep.'},
  {folder: 'Holographic', title: 'Holographic — Iridescent Foil', description: 'Rainbow foil, glitter flake and a shifting sheen — the full holographic sticker look.'},
  {folder: 'Kaleidoscope', title: 'Kaleidoscope — Fractal Bloom', description: 'Radial mirrored segments turn a single image into an intricate flower of glass and stone.'},
  {folder: 'Nebula', title: 'Nebula — Deep Space', description: 'Billowing emission clouds sealed inside polished glass, with a slow stellar drift.'},
  {folder: 'Neon', title: 'Neon — Light Ring', description: 'A photorealistic neon tube with a controlled glow falloff and a cold electric halo.'},
  {folder: 'ReactionDiffusion', title: 'ReactionDiffusion — Living Cells', description: 'Gray-Scott chemistry grows into coral, veins and living tissue across the layer.'},
  {folder: 'Voronoi', title: 'Voronoi — Cellular Glass', description: 'Distance-to-seed cellular geometry, colored like stained glass under pressure.'},
]
const CATEGORY_MAP = {
  Textures: 'textures',
  Stylize: 'stylize',
  'Shape Effects': 'shape-effects',
  Distortions: 'distortions',
  Transitions: 'transitions',
  Interactive: 'interactive',
  Adjustments: 'adjustments',
  Blurs: 'blurs',
  Shapes: 'shapes',
  Uncategorized: 'shapes',
  Utilities: 'utilities',
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function kebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function parseComponent(name) {
  const source = fs.readFileSync(path.join(SHADER_SRC, name, 'index.ts'), 'utf8')
  const displayName = (source.match(/name:\s*["']([^"']+)["']/) || [])[1] || name
  const rawCategory = (source.match(/category:\s*["']([^"']+)["']/) || [])[1] || 'Uncategorized'
  const description = (source.match(/description:\s*["']([^"']+)["']/) || [])[1] || `${displayName} WebGPU effect component.`
  return {
    folder: name,
    name: displayName,
    category: CATEGORY_MAP[rawCategory] || 'textures',
    rawCategory,
    description: description.replace(/\s+/g, ' ').trim(),
  }
}

function componentCode(component) {
  return `import { Shader, ${component.name} } from 'shaders/react'

export function Demo() {
  return (
    <Shader className="h-64 w-full">
      <${component.name} />
    </Shader>
  )
}`
}

function officialEntry() {
  return {
    id: 'sh-showcase',
    project: PROJECT,
    name: 'Shaders — 200 WebGPU Effects',
    category: 'official-showcase',
    style: ['webgpu', 'shader', 'official-showcase', 'effects', 'showcase'],
    techStack: ['WebGPU', 'WGSL', 'React', 'Vue', 'Svelte', 'JavaScript'],
    description:
      'A curated tour through 200 MIT-licensed WebGPU effect components: liquid color, chrome, holographic foil, kaleidoscope, nebula, neon, reaction-diffusion and Voronoi. Aurora, CursorRipples and FilmGrain can be stacked on one canvas; the browser editor exports the tree to React, Vue, Svelte or JavaScript.',
    codeSnippet: {
      language: 'tsx',
      source: `import { Shader, Aurora, CursorRipples, FilmGrain } from 'shaders/react'

export function Demo() {
  return (
    <Shader className="h-[420px] w-full">
      <Aurora colorA="#070b2a" colorB="#16e0ff" colorC="#9b5cff" intensity={82} speed={6} waviness={72} />
      <CursorRipples />
      <FilmGrain />
    </Shader>
  )
}`,
      dependencies: ['shaders'],
    },
    demoUrl: 'https://shaders.com/docs/components',
  }
}

function curatedEntry(component, demo) {
  return {
    id: `sh-demo-${kebab(demo.folder)}`,
    project: PROJECT,
    name: demo.title,
    category: 'official-demo',
    style: ['webgpu', 'shader', 'official-demo', component.category, 'curated'],
    techStack: ['WebGPU', 'WGSL', 'React', 'Vue', 'Svelte'],
    description: demo.description,
    codeSnippet: {
      language: 'tsx',
      source: componentCode(component),
      dependencies: ['shaders'],
    },
    demoUrl: `https://shaders.com/docs/components/${demo.folder.toLowerCase()}`,
  }
}

function main() {
  if (!fs.existsSync(SHADER_SRC)) {
    console.error(`[shaders] upstream shaders missing: ${SHADER_SRC}`)
    process.exitCode = 1
    return
  }
  const folders = fs
    .readdirSync(SHADER_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(SHADER_SRC, entry.name, 'index.ts')))
    .map((entry) => entry.name)
    .sort()

  const components = folders.map(parseComponent)
  const byName = new Map(components.map((component) => [component.name, component]))
  const official = officialEntry()
  const curated = CURATED_DEMOS.map((demo) => {
    const component = byName.get(demo.folder)
    if (!component) throw new Error(`[shaders] missing curated component ${demo.folder}`)
    return curatedEntry(component, demo)
  })
  const entries = []
  const summaries = []

  for (const component of components) {
    const id = `sh-${kebab(component.name)}`
    const cover = `/shaders/covers/${component.folder}.jpg`
    const entry = {
      id,
      project: PROJECT,
      name: component.name,
      category: component.category,
      style: ['webgpu', 'shader', component.category],
      techStack: ['WebGPU', 'WGSL', 'React', 'Vue', 'Svelte'],
      description: `${component.description}${component.description.endsWith('.') ? '' : '.'}`,
      codeSnippet: {
        language: 'tsx',
        source: componentCode(component),
        dependencies: ['shaders'],
      },
      demoUrl: `https://shaders.com/docs/components/${component.name.toLowerCase()}`,
    }
    entries.push(entry)
    summaries.push({
      id,
      project: PROJECT,
      name: component.name,
      category: component.category,
      style: entry.style,
      techStack: entry.techStack,
      description: entry.description,
      language: 'tsx',
      previewUrl: cover,
      tags: ['webgpu', 'shader', component.category, 'mit'],
    })
  }

  entries.push(official, ...curated)
  summaries.push({
    id: official.id,
    project: PROJECT,
    name: official.name,
    category: official.category,
    style: official.style,
    techStack: official.techStack,
    description: official.description,
    language: 'tsx',
    previewUrl: SHOWCASE_COVER,
    tags: ['webgpu', 'shader', 'official-showcase', 'effects', 'mit'],
  })
  for (const entry of curated) {
    summaries.push({
      id: entry.id,
      project: PROJECT,
      name: entry.name,
      category: entry.category,
      style: entry.style,
      techStack: entry.techStack,
      description: entry.description,
      language: 'tsx',
      previewUrl: `/shaders/covers/${curatedCover(entry.id)}`,
      tags: ['webgpu', 'shader', 'official-demo', 'mit'],
    })
  }

  writeJson(path.join(DATA_DIR, 'shaders.json'), entries)
  console.log(`[shaders] shaders.json: ${entries.length} entries (${components.length} components + ${curated.length} curated demos + 1 showcase)`)

  const index = readJson(path.join(DATA_DIR, 'index.json'))
  index.components = index.components.filter((component) => component.project !== PROJECT)
  index.components.push(...summaries)
  index.total = index.components.length
  index.projects = Array.from(new Set([...(index.projects || []), PROJECT]))
  index.stats = index.stats || {}
  index.stats[PROJECT] = entries.length
  writeJson(path.join(DATA_DIR, 'index.json'), index)
  console.log(`[shaders] index.json: +${summaries.length} entries, total ${index.total}`)

  const manifest = readJson(path.join(DATA_DIR, 'preview-manifest.json'))
  manifest.records = manifest.records.filter((record) => record.project !== PROJECT)
  for (const component of components) {
    manifest.records.push({
      id: `sh-${kebab(component.name)}`,
      project: PROJECT,
      kind: 'media-image',
      status: 'ready',
      media: {
        poster: `/shaders/covers/${component.folder}.jpg`,
        label: 'Shaders Official Component Cover',
      },
    })
  }
  for (const entry of [official, ...curated]) {
    manifest.records.push({
      id: entry.id,
      project: PROJECT,
      kind: 'media-image',
      status: 'ready',
      media: {
        poster: entry.id === official.id ? SHOWCASE_COVER : `/shaders/covers/${curatedCover(entry.id)}`,
        label: entry.id === official.id ? 'Shaders WebGPU Showcase Cover' : 'Shaders Curated Demo Cover',
      },
    })
  }
  manifest.stats = manifest.records.reduce((acc, record) => {
    const key = `${record.status}:${record.kind}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  writeJson(path.join(DATA_DIR, 'preview-manifest.json'), manifest)

  const byId = Object.fromEntries(manifest.records.map((record) => [record.id, record]))
  const manifestTs = `import type { PreviewManifestRecord } from './preview-types'

export const previewManifest: Record<string, PreviewManifestRecord> = ${JSON.stringify(byId, null, 2)}

export const previewStats = ${JSON.stringify(manifest.stats, null, 2)} as const

export function getPreviewRecord(id: string | null | undefined): PreviewManifestRecord | undefined {
  if (!id) return undefined
  return previewManifest[id]
}
`
  fs.writeFileSync(path.join(GENERATED_DIR, 'preview-manifest.ts'), manifestTs, 'utf8')
  console.log(`[shaders] preview manifest: ${manifest.records.length} records, ${components.length} image previews + 1 showcase cover`)
}

main()
