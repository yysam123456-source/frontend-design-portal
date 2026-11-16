/*
 * Integrate Shaders (https://github.com/shader-effects-inc/shaders, MIT) into the
 * portal catalogue.
 *
 * The upstream clone is kept outside the repository (e.g. /tmp/shaders-upstream)
 * because the portal's build treats repos/ as a local-only source tree. This
 * script writes committed data and assets:
 *
 *   public/data/shaders.json          200 component entries + 1 official showcase
 *   public/data/index.json            summaries, project list, stats
 *   public/data/preview-manifest.*    image previews + one live HTML playground
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

function officialEntry(playgroundHtml) {
  return {
    id: 'sh-showcase',
    project: PROJECT,
    name: 'Shaders — WebGPU Effect Playground',
    category: 'official-showcase',
    style: ['webgpu', 'shader', 'official-demo', 'playground', 'aurora'],
    techStack: ['WebGPU', 'WGSL', 'JavaScript'],
    description:
      'A live layered WebGPU playground for the Shaders library: Aurora, CursorRipples and FilmGrain stacked on one canvas. 200 MIT-licensed effect components, exported from the browser editor as React, Vue, Svelte or JavaScript.',
    codeSnippet: {
      language: 'html',
      source: playgroundHtml,
      dependencies: ['shaders'],
    },
    demoUrl: 'https://shaders.com/',
  }
}

function main() {
  if (!fs.existsSync(SHADER_SRC)) {
    console.error(`[shaders] upstream shaders missing: ${SHADER_SRC}`)
    process.exitCode = 1
    return
  }
  if (!fs.existsSync(PLAYGROUND)) {
    console.error(`[shaders] missing ${PLAYGROUND}`)
    process.exitCode = 1
    return
  }

  const playgroundHtml = fs.readFileSync(PLAYGROUND, 'utf8')
  const folders = fs
    .readdirSync(SHADER_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(SHADER_SRC, entry.name, 'index.ts')))
    .map((entry) => entry.name)
    .sort()

  const components = folders.map(parseComponent)
  const official = officialEntry(playgroundHtml)
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

  entries.push(official)
  summaries.push({
    id: official.id,
    project: PROJECT,
    name: official.name,
    category: official.category,
    style: official.style,
    techStack: official.techStack,
    description: official.description,
    language: 'html',
    previewUrl: '/shaders/covers/Aurora.jpg',
    tags: ['webgpu', 'shader', 'official-demo', 'playground', 'mit'],
  })

  writeJson(path.join(DATA_DIR, 'shaders.json'), entries)
  console.log(`[shaders] shaders.json: ${entries.length} entries (${components.length} components + 1 showcase)`)

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
  manifest.records.push({
    id: official.id,
    project: PROJECT,
    kind: 'media-image',
    status: 'ready',
    media: {
      poster: '/shaders/covers/Aurora.jpg',
      label: 'Shaders WebGPU Showcase Cover',
    },
  })
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
