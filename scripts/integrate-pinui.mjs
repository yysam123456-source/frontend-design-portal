// pinui 增量集成：把 Pin UI（pinui.xyz）的 30 个组件与 11 个 Blocx 整页区块
// 落到本仓库：vendor 源码 + 真实 React 预览 + 数据 + manifest + registry。
//
// 幂等可重复执行；只追加/覆盖 pinui 相关产物，不触碰其他项目数据。
// 上游源：repos/pinui/{registry,blocx}/*.json（pinui.xyz/r/*.json 的缓存，已 gitignore）
//
// 用法：node scripts/integrate-pinui.mjs [--refetch]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')
const REG_DIR = path.join(ROOT, 'repos', 'pinui', 'registry')
const BLX_DIR = path.join(ROOT, 'repos', 'pinui', 'blocx')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const GEN_DIR = path.join(ROOT, 'src', 'generated')
const VENDOR_DIR = path.join(GEN_DIR, 'vendor', 'pinui')
const PREVIEW_DIR = path.join(GEN_DIR, 'previews', 'pinui')
const PUBLIC_DIR = path.join(ROOT, 'public')

const SITE = 'https://www.pinui.xyz'
const REFETCH = process.argv.includes('--refetch')

// Pin UI 官网的分组 → 门户的分类
const COMPONENT_CATEGORY = {
  'presence-cards': 'cards',
  'reader-card': 'cards',
  'file-box': 'cards',
  'task-card': 'cards',
  'magnify': 'cards',
  'calendar-card': 'cards',
  'swap-card': 'cards',
  'thermal-dial': 'cards',
  'weather': 'cards',
  'taxi': 'cards',
  'balance-card': 'cards',
  'cart-card': 'cards',
  'theme-switch': 'inputs',
  'search-card': 'inputs',
  'desk-computer': 'inputs',
  'copy-paste-pad': 'inputs',
  'progress-image': 'inputs',
  'prompt-composer': 'inputs',
  'dynamic-drop-zone': 'inputs',
  'lamp-switch': 'inputs',
  'joystick': 'inputs',
  'chips': 'inputs',
  'otp-input': 'inputs',
  'liquid-voice': 'audio',
  'recorder': 'audio',
  'selection-list': 'lists',
  'chat-room': 'lists',
  'liquid-tabs': 'lists',
  'add-member': 'lists',
  'session-list': 'lists',
}

// 需要 next/font 之外的两个第三方依赖，按约定跳过移植，只保留外链卡片
const BLOCX_SKIP = new Set(['luna-hero'])

// registry 里没有、要从官网补的静态资源
const REMOTE_ASSETS = [
  '/library/shoe.jpg',
  '/library/desk-computer.svg',
  '/blocx/caremetric-footer/texture.webp',
  '/blocx/contact-form/hand.webp',
  '/blocx/orbit-hero/earth.webp',
  '/blocx/orbit-hero/surface.webp',
  '/blocx/orbit-hero/clouds.webp',
  '/blocx/orbit-hero/logo.webp',
]

// next/font 注入的字体变量，移植后改用本地字体栈（不新增依赖、不引外部字体）
const FONT_VARS_CSS = `/* Pin UI Blocx — 上游用 next/font 注入字体变量，移植后在这里补上本地字体栈。 */
:root {
  --sbh-font: "Inter Tight", "Inter", "Segoe UI", system-ui, sans-serif;
  --cf-font: "Inter Tight", "Inter", "Segoe UI", system-ui, sans-serif;
  --sy-font: "Inter Tight", "Inter", "Segoe UI", system-ui, sans-serif;
  --hsi-font: "Inter", "Segoe UI", system-ui, sans-serif;
  --pksi-font: "Inter", "Segoe UI", system-ui, sans-serif;
  --sp-inter: "Inter", "Segoe UI", system-ui, sans-serif;
  --sp-bricolage: "Bricolage Grotesque", "Inter", "Segoe UI", system-ui, sans-serif;
  --sp-urbanist: "Urbanist", "Inter", "Segoe UI", system-ui, sans-serif;
  --oh-serif: "Instrument Serif", Georgia, "Times New Roman", serif;
  --font-geist-sans: "Geist", "Inter", "Segoe UI", system-ui, sans-serif;
}
`

function readRegistry(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter((j) => j.files?.length)
}

function writeIfChanged(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false
  fs.writeFileSync(file, content, 'utf8')
  return true
}

function withNoCheck(content) {
  return content.startsWith('// @ts-nocheck') ? content : `// @ts-nocheck\n${content}`
}

// 上游 Blocx 依赖 next/font：剥掉 import 与字体对象声明，改用 FONT_VARS_CSS 里的变量
function transformBlocx(content) {
  return content
    .replace(/^import\s*\{[^}]*\}\s*from\s*["']next\/font\/google["'];?[ \t]*\r?\n/gm, '')
    .replace(/^import\s*\{[^}]*\}\s*from\s*["']geist\/font\/sans["'];?[ \t]*\r?\n/gm, '')
    .replace(
      /^const\s+\w+\s*=\s*(?:Inter_Tight|Inter|Instrument_Serif|Bricolage_Grotesque|Urbanist|DM_Sans|Schibsted_Grotesk)\(\{[\s\S]*?\}\);[ \t]*\r?\n/gm,
      '',
    )
    .replace(/[ \t]*\$\{\s*\w+\.variable\s*\}/g, '')
}

function findMainTsx(j) {
  const files = j.files.filter((f) => f.path.endsWith('.tsx'))
  return files.find((f) => /export\s+default/.test(f.content)) || files[0]
}

function defaultExportName(source) {
  const m =
    source.match(/export\s+default\s+function\s+(\w+)/) ||
    source.match(/export\s+default\s+(\w+)\s*;/) ||
    source.match(/export\s+function\s+(\w+)/)
  return m ? m[1] : 'Component'
}

function previewSource({ importPath, kind }) {
  const isBlocx = kind === 'blocx'
  // 组件演示区按上游设计的最小舞台 480×480 渲染再等比缩小，避免宽容器里元素挤在角落
  const stage = isBlocx
    ? "{ width: 1440, height: 810, flex: 'none', transform: 'scale(0.2)', transformOrigin: 'center' }"
    : "{ width: 480, height: 480, flex: 'none', transform: 'scale(0.35)', transformOrigin: 'center' }"
  const bg = isBlocx ? '#111111' : '#eeece6'
  return `// @ts-nocheck
import * as ComponentModule from '${importPath}'
${isBlocx ? "import '../../vendor/pinui/pinui-fonts.css'\n" : ''}const Component = ComponentModule.default

export default function Preview({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden"
        style={{ background: '${bg}' }}
      >
        <div style={${stage}}>
          <Component />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full overflow-hidden" style={{ background: '${bg}' }}>
      <Component />
    </div>
  )
}
`
}

function transformUrl(name, kind) {
  return `${SITE}/r/${kind === 'blocx' ? 'blocx/' : ''}${name}.json`
}

function snippetFor({ j, exportName, kind }) {
  const importPath = kind === 'blocx' ? `@/components/blocx/${exportName}` : `./${exportName}`
  return `// ${j.title} — Pin UI
// npx shadcn@latest add "${transformUrl(j.name, kind)}"

import ${exportName} from "${importPath}";

export default function Page() {
  return <${exportName} />;
}
`
}

function fullSourceFor({ j, kind }) {
  const main = findMainTsx(j)
  const note =
    kind === 'blocx'
      ? '// 上游为 Next.js 区块：next/font 已换成本地字体栈，静态资源放在 public/blocx/ 下。\n'
      : ''
  return `// ${j.title} — Pin UI (${kind === 'blocx' ? 'Blocx' : 'Component'})
// npx shadcn@latest add "${transformUrl(j.name, kind)}"
${note}\n${main.content}`
}

function componentEntry(j, kind) {
  const main = findMainTsx(j)
  const exportName = defaultExportName(main.content)
  const techStack =
    j.name === 'copy-paste-pad'
      ? ['React', 'TypeScript', 'Three.js', 'CSS', 'Motion']
      : ['React', 'TypeScript', 'CSS', 'Motion']

  return {
    id: `pin-${j.name}`,
    project: 'pinui',
    name: j.title || j.name,
    category: kind === 'blocx' ? 'official-demo' : COMPONENT_CATEGORY[j.name] || 'cards',
    style: ['pinui', kind === 'blocx' ? 'page-block' : 'component', 'animated'],
    techStack,
    description: j.description || `${j.title} — Pin UI ${kind === 'blocx' ? 'page block' : 'component'}.`,
    language: 'tsx',
    demoUrl: transformUrl(j.name, kind),
    codeSnippet: {
      language: 'tsx',
      source: snippetFor({ j, exportName, kind }),
      dependencies: (j.dependencies || []).length ? j.dependencies : ['motion'],
    },
  }
}

async function fetchTo(url, dest) {
  if (!REFETCH && fs.existsSync(dest)) return false
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
  return true
}

async function main() {
  if (!fs.existsSync(REG_DIR)) {
    console.log('[integrate-pinui] repos/pinui/registry missing. Cache pinui.xyz/r/*.json first.')
    return
  }

  const components = readRegistry(REG_DIR)
  const blocx = readRegistry(BLX_DIR)
  console.log(`[integrate-pinui] upstream: ${components.length} components, ${blocx.length} blocx`)

  // ── 1. vendor 源码 + public 资源 ────────────────────────────────
  fs.rmSync(VENDOR_DIR, { recursive: true, force: true })
  fs.mkdirSync(path.join(VENDOR_DIR, 'components'), { recursive: true })
  fs.mkdirSync(path.join(VENDOR_DIR, 'blocx'), { recursive: true })
  writeIfChanged(path.join(VENDOR_DIR, 'pinui-fonts.css'), FONT_VARS_CSS)

  let written = 0
  const skipped = []

  for (const j of components) {
    for (const f of j.files) {
      const base = path.basename(f.path)
      const content = /\.(tsx|ts)$/.test(base) ? withNoCheck(f.content) : f.content
      if (writeIfChanged(path.join(VENDOR_DIR, 'components', base), content)) written++
    }
  }

  for (const j of blocx) {
    if (BLOCX_SKIP.has(j.name)) {
      skipped.push(j.name)
      continue
    }
    for (const f of j.files) {
      if (f.path.startsWith('public/')) {
        // registry 自带的静态资源直接落到 public 根目录
        if (writeIfChanged(path.join(PUBLIC_DIR, f.path.replace(/^public\//, '')), f.content)) written++
        continue
      }
      const base = path.basename(f.path)
      const content = /\.(tsx|ts)$/.test(base) ? withNoCheck(transformBlocx(f.content)) : f.content
      if (writeIfChanged(path.join(VENDOR_DIR, 'blocx', base), content)) written++
    }
  }

  for (const asset of REMOTE_ASSETS) {
    try {
      if (await fetchTo(`${SITE}${asset}`, path.join(PUBLIC_DIR, asset.replace(/^\//, '')))) {
        console.log(`[integrate-pinui] asset fetched: ${asset}`)
      }
    } catch (e) {
      console.log(`[integrate-pinui] asset FAILED: ${asset} — ${e.message}`)
    }
  }
  console.log(
    `[integrate-pinui] vendor files written: ${written}${skipped.length ? ` (skipped: ${skipped.join(', ')})` : ''}`,
  )

  // ── 2. 预览组件 ───────────────────────────────────────────────
  fs.rmSync(PREVIEW_DIR, { recursive: true, force: true })
  fs.mkdirSync(PREVIEW_DIR, { recursive: true })

  const entries = []
  const manifestRecords = []

  for (const j of components) {
    const main = findMainTsx(j)
    const id = `pin-${j.name}`
    fs.writeFileSync(
      path.join(PREVIEW_DIR, `${id}.tsx`),
      previewSource({
        importPath: `../../vendor/pinui/components/${path.basename(main.path, '.tsx')}`,
        kind: 'component',
      }),
      'utf8',
    )
    entries.push(componentEntry(j, 'component'))
    manifestRecords.push({ id, project: 'pinui', kind: 'react-generated', status: 'ready', entry: `./previews/pinui/${id}` })
  }

  for (const j of blocx) {
    const id = `pin-${j.name}`
    entries.push(componentEntry(j, 'blocx'))
    if (BLOCX_SKIP.has(j.name)) {
      manifestRecords.push({
        id,
        project: 'pinui',
        kind: 'unsupported',
        status: 'unsupported',
        reason:
          'Upstream needs @base-ui/react and @phosphor-icons/react — open the official demo instead.',
      })
      continue
    }
    const main = findMainTsx(j)
    fs.writeFileSync(
      path.join(PREVIEW_DIR, `${id}.tsx`),
      previewSource({
        importPath: `../../vendor/pinui/blocx/${path.basename(main.path, '.tsx')}`,
        kind: 'blocx',
      }),
      'utf8',
    )
    manifestRecords.push({ id, project: 'pinui', kind: 'react-generated', status: 'ready', entry: `./previews/pinui/${id}` })
  }

  console.log(`[integrate-pinui] previews generated: ${entries.length}`)

  // ── 3. public/data/pinui.json（完整源码，详情抽屉用） ─────────────
  const fullEntries = []
  for (const j of components) {
    fullEntries.push({
      ...componentEntry(j, 'component'),
      codeSnippet: {
        language: 'tsx',
        source: fullSourceFor({ j, kind: 'component' }),
        dependencies: (j.dependencies || []).length ? j.dependencies : ['motion'],
      },
    })
  }
  for (const j of blocx) {
    fullEntries.push({
      ...componentEntry(j, 'blocx'),
      codeSnippet: {
        language: 'tsx',
        source: fullSourceFor({ j, kind: 'blocx' }),
        dependencies: (j.dependencies || []).length ? j.dependencies : ['motion'],
      },
      ...(BLOCX_SKIP.has(j.name) ? { previewUrl: `${SITE}/blocx/${j.name}` } : {}),
    })
  }
  writeIfChanged(path.join(DATA_DIR, 'pinui.json'), JSON.stringify(fullEntries, null, 2))

  // ── 4. index.json 合并（先清旧 pinui，再追加，保证幂等） ──────────
  const indexPath = path.join(DATA_DIR, 'index.json')
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  index.components = index.components.filter((c) => c.project !== 'pinui')
  index.components.push(...entries)
  index.total = index.components.length
  index.stats.pinui = entries.length
  if (!index.projects.includes('pinui')) index.projects.push('pinui')
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
  console.log(`[integrate-pinui] index.json: ${entries.length} entries, total ${index.total}`)

  // ── 5. preview-manifest.json + preview-manifest.ts ─────────────
  const manifestPath = path.join(DATA_DIR, 'preview-manifest.json')
  const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifestJson.records = manifestJson.records.filter((r) => r.project !== 'pinui')
  manifestJson.records.push(...manifestRecords)
  manifestJson.stats = manifestJson.records.reduce((acc, r) => {
    const key = `${r.status}:${r.kind}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2), 'utf8')

  const manifestTsPath = path.join(GEN_DIR, 'preview-manifest.ts')
  const manifestTs = fs.readFileSync(manifestTsPath, 'utf8')
  const manifestAnchor = manifestTs.indexOf('export const previewManifest')
  const objStart = manifestTs.indexOf('{', manifestAnchor)
  const statsAnchor = manifestTs.indexOf('export const previewStats')
  const objEnd = manifestTs.lastIndexOf('}', statsAnchor)
  const parsed = JSON.parse(manifestTs.slice(objStart, objEnd + 1))
  for (const id of Object.keys(parsed)) {
    if (id.startsWith('pin-')) delete parsed[id]
  }
  for (const rec of manifestRecords) parsed[rec.id] = rec

  const tail = manifestTs.slice(statsAnchor)
  const statsStart = tail.indexOf('{')
  const statsEnd = tail.indexOf('}', statsStart)
  const nextTs =
    manifestTs.slice(0, objStart) +
    JSON.stringify(parsed, null, 2) +
    '\n\n' +
    tail.slice(0, statsStart) +
    JSON.stringify(manifestJson.stats, null, 2) +
    tail.slice(statsEnd + 1)
  fs.writeFileSync(manifestTsPath, nextTs, 'utf8')
  console.log('[integrate-pinui] preview manifest updated')

  // ── 6. preview-registry.ts ─────────────────────────────────────
  const registryPath = path.join(GEN_DIR, 'preview-registry.ts')
  const regLines = fs
    .readFileSync(registryPath, 'utf8')
    .split('\n')
    .filter((line) => !line.includes("'./previews/pinui/"))
  // 注册表对象的收尾 `}` 是锚点之后第一行单独的 `}`
  const anchorIdx = regLines.findIndex((l) => l.includes('export const previewRegistry'))
  const closeIdx = regLines.findIndex((l, i) => i > anchorIdx && l.trim() === '}')
  const pinLines = manifestRecords
    .filter((r) => r.status === 'ready')
    .map((r) => `  ${JSON.stringify(r.id)}: () => import('./previews/pinui/${r.id}'),`)
  regLines.splice(closeIdx, 0, ...pinLines)
  fs.writeFileSync(registryPath, regLines.join('\n'), 'utf8')
  console.log('[integrate-pinui] preview-registry.ts updated')
}

main()
