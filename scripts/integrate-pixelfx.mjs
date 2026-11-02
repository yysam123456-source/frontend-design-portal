// pixelfx 增量集成：从 repos/pixelfx 生成数据、预览、manifest、registry
// 幂等可重复执行；只追加 pixelfx 相关产物，不触碰其他项目数据。
// 与 extract-components.mjs / generate-previews.mjs 的未来全量管线保持一致。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')
const REPO_SRC = path.join(ROOT, 'repos', 'pixelfx', 'src')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const GEN_DIR = path.join(ROOT, 'src', 'generated')
const VENDOR_DIR = path.join(GEN_DIR, 'vendor', 'pixelfx')
const PREVIEW_DIR = path.join(GEN_DIR, 'previews', 'pixelfx')

const FXLIB = '_lib.js'
const CATEGORY = 'pixel-fx'

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (entry.name.endsWith('.js')) out.push(p)
  }
  return out
}

// GSC/上游 effect 的 meta 是对象字面量：把裸键转成 JSON 键再解析
function parseMeta(source) {
  const m = source.match(/export const meta = \{([\s\S]*?)\n\s*\};/)
  if (!m) return null
  const body = m[1]
    .replace(/(^|[,{\n])\s*([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/,\s*$/, '')
  try {
    return JSON.parse('{' + body + '}')
  } catch {
    return null
  }
}

function titleName(fileName) {
  return fileName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildComponents() {
  const components = []
  for (const catDir of fs.readdirSync(path.join(REPO_SRC, 'fx'), { withFileTypes: true })) {
    if (!catDir.isDirectory()) continue
    const cat = catDir.name
    for (const f of walk(path.join(REPO_SRC, 'fx', cat))) {
      if (path.basename(f) === FXLIB) continue
      const source = fs.readFileSync(f, 'utf8')
      const meta = parseMeta(source)
      const fileName = path.basename(f, '.js')
      const id = `px-${cat}-${fileName}`
      const style = [...new Set(['pixel-art', cat, ...(meta?.tags?.slice(0, 4) || [])])].slice(0, 6)
      components.push({
        id,
        project: 'pixelfx',
        name: meta?.name || titleName(fileName),
        category: CATEGORY,
        style,
        techStack: ['Canvas API', 'JavaScript', 'ESM'],
        description: meta
          ? `${meta.name} pixel art effect — ${meta.desc}`
          : `${titleName(fileName)} ${cat} pixel art effect for canvas games — fire, magic, weather, UI and more.`,
        language: 'js',
        codeSnippet: { language: 'js', source },
        meta: meta
          ? {
              size: meta.size,
              origin: meta.origin,
              duration: meta.duration,
              loop: Boolean(meta.loop),
              fps: meta.fps,
            }
          : undefined,
      })
    }
  }
  components.sort((a, b) => a.id.localeCompare(b.id))
  return components
}

function copyTreeIfChanged(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) copyTreeIfChanged(s, d)
    else if (!fs.existsSync(d) || fs.statSync(s).size !== fs.statSync(d).size) fs.copyFileSync(s, d)
  }
}

function previewSource(component) {
  const cat = component.id.slice(3, component.id.indexOf('-', 3))
  const file = component.id.slice(component.id.lastIndexOf('-') + 1)
  const fxPath = `../../vendor/pixelfx/fx/${cat}/${file}.js`
  return `// @ts-nocheck
import { useEffect, useRef } from 'react'
import * as FxModule from '${fxPath}'
import { createFrame, clearFrame, createFx, composite } from '../../vendor/pixelfx/core/index.js'

export default function Preview({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const meta = FxModule.meta || {}
    const [W, H] = meta.size || [160, 160]
    const [ox, oy] = meta.origin || [W / 2, H / 2]
    canvas.width = W
    canvas.height = H
    const frame = createFrame(W, H)
    const img = ctx.createImageData(W, H)
    const fx = createFx(FxModule, { x: ox, y: oy, seed: 7 })
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      fx.update(dt)
      clearFrame(frame)
      fx.draw(frame, 'back')
      fx.draw(frame, 'front')
      composite(frame, img.data, null)
      ctx.putImageData(img, 0, 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={
        compact
          ? 'flex h-full w-full items-center justify-center overflow-hidden bg-[#0a0e14]'
          : 'flex min-h-[360px] w-full items-center justify-center overflow-hidden bg-[#0a0e14] p-8'
      }
    >
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated', width: '100%', maxWidth: '480px', height: 'auto' }}
      />
    </div>
  )
}
`
}

function main() {
  if (!fs.existsSync(path.join(REPO_SRC, 'fx'))) {
    console.log('[integrate-pixelfx] repos/pixelfx/src missing. Copy the upstream src first.')
    return
  }
  const components = buildComponents()
  console.log(`[integrate-pixelfx] effects extracted: ${components.length}`)

  // 1. data/pixelfx.json
  fs.writeFileSync(
    path.join(DATA_DIR, 'pixelfx.json'),
    JSON.stringify(components, null, 2),
    'utf8',
  )

  // 2. index.json 合并（幂等）
  const indexPath = path.join(DATA_DIR, 'index.json')
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const ids = new Set(index.components.map((c) => c.id))
  const fresh = components.filter((c) => !ids.has(c.id))
  index.components.push(...fresh)
  index.total = index.components.length
  index.stats.pixelfx = components.length
  if (!index.projects.includes('pixelfx')) index.projects.push('pixelfx')
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
  console.log(`[integrate-pixelfx] index.json: +${fresh.length} components, total ${index.total}`)

  // 3. vendor：core + fx 拷贝
  fs.rmSync(VENDOR_DIR, { recursive: true, force: true })
  copyTreeIfChanged(path.join(REPO_SRC, 'core'), path.join(VENDOR_DIR, 'core'))
  copyTreeIfChanged(path.join(REPO_SRC, 'fx'), path.join(VENDOR_DIR, 'fx'))
  console.log(`[integrate-pixelfx] vendor copied (${(fs.readdirSync(VENDOR_DIR).length)} top dirs)`)

  // 4. previews tsx
  fs.rmSync(PREVIEW_DIR, { recursive: true, force: true })
  fs.mkdirSync(PREVIEW_DIR, { recursive: true })
  for (const c of components) {
    fs.writeFileSync(path.join(PREVIEW_DIR, `${c.id}.tsx`), previewSource(c), 'utf8')
  }
  console.log(`[integrate-pixelfx] previews generated: ${components.length}`)

  // 5. manifest json（records 合并 + stats 重算）
  const manifestPath = path.join(DATA_DIR, 'preview-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  let changed = 0
  const existingIds = new Set(manifest.records.map((r) => r.id))
  for (const c of components) {
    if (existingIds.has(c.id)) continue
    manifest.records.push({
      id: c.id,
      project: 'pixelfx',
      kind: 'react-generated',
      status: 'ready',
      entry: `./previews/pixelfx/${c.id}`,
    })
    changed++
  }
  manifest.stats = Object.values(manifest.records).reduce((acc, r) => {
    const key = `${r.status}:${r.kind}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`[integrate-pixelfx] manifest records: +${changed}`)

  // 6. preview-manifest.ts
  const manifestTsPath = path.join(GEN_DIR, 'preview-manifest.ts')
  let manifestTs = fs.readFileSync(manifestTsPath, 'utf8')
  const anchor = manifestTs.indexOf('export const previewManifest')
  const objStart = manifestTs.indexOf('{', anchor)
  const statsAnchor = manifestTs.indexOf('export const previewStats')
  const objEnd = manifestTs.lastIndexOf('}', statsAnchor)
  const obj = manifestTs.slice(objStart, objEnd + 1)
  const parsed = JSON.parse(obj)
  for (const c of components) {
    parsed[c.id] = {
      id: c.id,
      project: 'pixelfx',
      kind: 'react-generated',
      status: 'ready',
      entry: `./previews/pixelfx/${c.id}`,
    }
  }
  const newObj = JSON.stringify(parsed, null, 2)
  manifestTs =
    manifestTs.slice(0, objStart) + newObj + manifestTs.slice(objEnd + 1)
  fs.writeFileSync(manifestTsPath, manifestTs, 'utf8')
  console.log('[integrate-pixelfx] preview-manifest.ts updated')

  // 7. preview-registry.ts（幂等追加）
  const registryPath = path.join(GEN_DIR, 'preview-registry.ts')
  let registryTs = fs.readFileSync(registryPath, 'utf8')
  if (registryTs.includes('previews/pixelfx/')) {
    console.log('[integrate-pixelfx] preview-registry.ts already contains pixelfx (skip)')
  } else {
    const braceIdx = registryTs.lastIndexOf('}')
    const lines = components.map(
      (c) => `  ${JSON.stringify(c.id)}: () => import('./previews/pixelfx/${c.id}'),`,
    )
    registryTs =
      registryTs.slice(0, braceIdx) + lines.join('\n') + '\n' + registryTs.slice(braceIdx)
    fs.writeFileSync(registryPath, registryTs, 'utf8')
    console.log('[integrate-pixelfx] preview-registry.ts updated')
  }
}

main()
