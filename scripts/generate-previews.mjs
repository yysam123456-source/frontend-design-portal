import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const dataDir = path.join(rootDir, 'public', 'data')
const generatedDir = path.join(rootDir, 'src', 'generated')
const previewDir = path.join(generatedDir, 'previews')
const vendorDir = path.join(generatedDir, 'vendor')
const shimDir = path.join(generatedDir, 'shims')
const publicAssetsDir = path.join(rootDir, 'public', 'demo-assets')

const READY_LOCAL_IDS = new Set([
  'at-faq',
  'at-spinner',
  'at-typing-text',
  'at-battery',
  'at-shift-tabs',
])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
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

function normalizeIdPart(fileName) {
  return fileName.replace(/\.tsx$/i, '').toLowerCase()
}

function normalizePreviewSlug(value = '') {
  return String(value)
    .replace(/Code$/i, '')
    .replace(/\.(tsx|jsx|ts|js|html|mp4|webm)$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

function copyFileIfChanged(source, target) {
  ensureDir(path.dirname(target))
  if (fs.existsSync(target) && fs.statSync(source).size === fs.statSync(target).size) return
  fs.copyFileSync(source, target)
}

function isSafeAnimataSource(source) {
  const unsupportedPatterns = [
    /from\s+['"]next\//,
    /from\s+['"]@\/animata\//,
    /from\s+['"]@\/components\//,
    /from\s+['"]@\/hooks\//,
    /from\s+['"]@\/config\//,
    /from\s+['"]@\/types\//,
    /from\s+['"]\.{1,2}\//,
    /import\s+['"]\.{1,2}\//,
    /import\s+\{[^}]*\b(Dribbble|Facebook|Linkedin)\b[^}]*\}\s+from\s+['"]lucide-react['"]/,
    /new\s+Audio\(/,
    /navigator\./,
  ]
  if (unsupportedPatterns.some((pattern) => pattern.test(source))) return false

  const allowedPackages = new Set([
    'react',
    'motion/react',
    'framer-motion',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ])

  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1]
    if (!specifier) continue
    if (specifier.startsWith('@/lib/utils')) continue
    if (specifier.startsWith('@radix-ui/')) continue
    if (allowedPackages.has(specifier)) continue
    return false
  }

  return true
}

function rewriteAnimataSource(source) {
  const rewritten = source
    .replace(/from\s+['"]@\/lib\/utils['"]/g, `from '../../../shims/utils'`)
    .replace(/from\s+['"]motion\/react['"]/g, `from 'motion/react'`)

  return `// @ts-nocheck
${rewritten}`
}

function rewriteEldoraSource(source, kind = 'component') {
  const utilsPath = kind === 'example' ? '../../../shims/utils' : '../../../shims/utils'
  const rewritten = source
    .replace(/from\s+['"]@\/lib\/utils['"]/g, `from '${utilsPath}'`)
    .replace(/from\s+['"]@\/registry\/eldoraui\/holographic-card['"]/g, `from '../component/holographic-card'`)

  return `// @ts-nocheck
${rewritten}`
}

function getExportName(source) {
  if (/export\s+default\b/.test(source)) return 'default'
  if (/export\s+\{\s*default\s*\}/.test(source)) return 'default'
  return (
    source.match(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/)?.[1] ||
    source.match(/export\s+const\s+([A-Za-z_$][\w$]*)(?:\s*:[^=]+)?\s*=/)?.[1] ||
    source.match(/export\s+class\s+([A-Za-z_$][\w$]*)/)?.[1] ||
    null
  )
}

function extractBalancedObject(source, startIndex) {
  const openIndex = source.indexOf('{', startIndex)
  if (openIndex < 0) return null
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) return source.slice(openIndex, i + 1)
  }
  return null
}

function extractPrimaryStoryArgs(storyPath) {
  if (!storyPath || !fs.existsSync(storyPath)) return null
  const story = fs.readFileSync(storyPath, 'utf-8')
  const primaryIndex = story.search(/export\s+const\s+Primary\b/)
  if (primaryIndex < 0) return null
  const argsIndex = story.indexOf('args', primaryIndex)
  if (argsIndex < 0) return null
  const argsObject = extractBalancedObject(story, argsIndex)
  if (!argsObject) return null
  // 首轮只内联纯数据 args，含 JSX、spread 或外部变量引用的 args 需要后续生成 import 依赖。
  if (/[<>]/.test(argsObject)) return null
  if (/\.\.\./.test(argsObject)) return null
  if (/:\s*[A-Za-z_$][\w$]*(?=\s*[,}])/.test(argsObject)) return null
  if (/[{,]\s*[A-Za-z_$][\w$]*\s*[,}]/.test(argsObject)) return null
  return argsObject
}

function inferFallbackArgs(source) {
  const args = []
  if (/\bchildren\b/.test(source)) args.push(`children: 'Preview Component'`)
  if (/\btext\b/.test(source)) args.push(`text: 'Preview Component'`)
  if (/\btitle\b/.test(source)) args.push(`title: 'Preview Title'`)
  if (/\blabel\b/.test(source)) args.push(`label: 'Preview Label'`)
  if (/\bdescription\b/.test(source)) args.push(`description: 'This is a generated preview.'`)
  if (/\bhref\b/.test(source)) args.push(`href: '#'`)
  if (/\binitialComments\b/.test(source)) {
    args.push(`initialComments: [{ id: 1, user: 'Mike', text: ['This preview is generated from fallback props.'], time: 'now', avatarColor: '#e8824b' }]`)
  }
  if (/\bdirectionValues\b/.test(source)) {
    args.push(`directionValues: [
      { distance: 350, direction: 'right', to: 'Gurkha St.', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg> },
      { distance: 700, direction: 'left', to: 'Rounding St.', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M19 12H5M12 5l-7 7 7 7"/></svg> },
      { distance: 100, direction: 'straight', to: 'Hwy 16', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg> }
    ]`)
  }
  if (/\bitems\b/.test(source)) {
    args.push(`items: [
      { id: 'a', title: 'Home', name: 'Home', icon: <span>⌂</span>, href: '#' },
      { id: 'b', title: 'Search', name: 'Search', icon: <span>⌕</span>, href: '#' },
      { id: 'c', title: 'Settings', name: 'Settings', icon: <span>⚙</span>, href: '#' }
    ]`)
  }
  if (/\bclassName\b/.test(source)) args.push(`className: 'text-4xl font-bold'`)
  return args.length ? `{ ${args.join(', ')} }` : '{}'
}

function resolveAnimataPreviewArgs(id, source, storyPath = '') {
  if (id === 'at-comment-reply-card' || id === 'at-direction-card') return inferFallbackArgs(source)
  return extractPrimaryStoryArgs(storyPath) || inferFallbackArgs(source)
}

function inferEldoraFallbackArgs(source, id) {
  const args = []
  if (/\btext\b/.test(source)) args.push(`text: 'Eldora UI Preview'`)
  if (/\bclassName\b/.test(source)) args.push(`className: ''`)
  if (/\bduration\b/.test(source)) args.push(`duration: 0.5`)
  if (/\bdelay\b/.test(source)) args.push(`delay: 0.05`)
  if (/\bhref\b/.test(source)) args.push(`href: '#'`)
  if (id.includes('holographic-card')) {
    args.push(`title: 'Holographic Card'`)
    args.push(`description: 'Interactive Eldora UI preview'`)
  }
  return args.length ? `{ ${args.join(', ')} }` : '{}'
}

function buildEldoraGeneratedIds() {
  const result = new Map()
  const dataPath = path.join(dataDir, 'eldoraui.json')
  if (!fs.existsSync(dataPath)) return result
  const items = readJson(dataPath)
  const allowedIds = new Set([
    'ed-component-animated-shiny-text',
    'ed-component-aurora-text',
    'ed-component-blur-fade',
    'ed-component-holographic-card',
    'ed-component-line-shadow-text',
    'ed-component-marquee',
    'ed-component-text-animate',
    'ed-component-text-shimmer',
    'ed-example-holographic-card-demo',
    'ed-example-holographic-card-demo-2',
    'ed-example-holographic-card-demo-3',
  ])

  for (const item of items) {
    if (!allowedIds.has(item.id)) continue
    const source = item.codeSnippet?.source
    if (!source) continue
    const exportName = getExportName(source)
    if (!exportName) continue
    const kind = item.id.startsWith('ed-example-') ? 'example' : 'component'
    const slug = item.id.replace(/^ed-(component|example)-/, '')
    const vendorOut = path.join(vendorDir, 'eldoraui', kind, `${slug}.tsx`)
    const previewOut = path.join(previewDir, 'eldoraui', `${item.id}.tsx`)
    ensureDir(path.dirname(vendorOut))
    ensureDir(path.dirname(previewOut))
    fs.writeFileSync(vendorOut, rewriteEldoraSource(source, kind))

    const importPath = `../../vendor/eldoraui/${kind}/${slug}`
    const previewArgs = inferEldoraFallbackArgs(source, item.id)
    const componentExpr =
      exportName === 'default'
        ? 'ComponentModule.default'
        : `ComponentModule.${exportName}`
    fs.writeFileSync(
      previewOut,
      `// @ts-nocheck
import * as ComponentModule from '${importPath}'

const Component = ${componentExpr}
const previewProps = ${previewArgs}
const previewChildren = (
  <div className="flex min-w-64 flex-col gap-3">
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90">Eldora UI</div>
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70">Generated live preview</div>
  </div>
)

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-neutral-950 p-8 text-white'}>
      <div style={compact ? { transform: 'scale(0.62)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>{previewChildren}</Component>
      </div>
    </div>
  )
}
`,
    )
    result.set(item.id, `./previews/eldoraui/${item.id}`)
  }

  return result
}

function normalizeFileStem(value = '') {
  return value.replace(/\.(tsx|ts|jsx|js)$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function rewriteZeldaSource(source, fileOutDir) {
  const assetsDir = path.join(vendorDir, 'zelda-hyrule-ui', 'assets')
  const utilsDir = path.join(vendorDir, 'zelda-hyrule-ui', 'utils')
  const toRel = (target) => {
    let rel = path.relative(fileOutDir, target).replace(/\\/g, '/')
    if (!rel.startsWith('.')) rel = './' + rel
    return rel
  }
  return `// @ts-nocheck
${source
  .replace(/from\s+['"]@core\/assets\/(svg|img)\/([^'"]+)['"]/g, (_match, kind, file) => {
    return `from '${toRel(path.join(assetsDir, kind, file))}'`
  })
  .replace(/from\s+['"](?:\.\.\/){1,4}utils\/a11y['"]/g, `from '${toRel(path.join(utilsDir, 'a11y'))}'`)
}`
}

function buildZeldaGeneratedIds() {
  const result = new Map()
  const dataPath = path.join(dataDir, 'zelda-hyrule-ui.json')
  if (!fs.existsSync(dataPath)) return result
  const items = readJson(dataPath)
  const componentsRoot = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'packages', 'react', 'src', 'components')
  const coreAssetsRoot = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'packages', 'core', 'assets')
  if (!fs.existsSync(componentsRoot)) return result

  const tsxFiles = walkFiles(componentsRoot, (file) => file.endsWith('.tsx'))
  const byStem = new Map()
  for (const file of tsxFiles) byStem.set(normalizeFileStem(path.basename(file)), file)

  for (const sourceAsset of walkFiles(coreAssetsRoot, (file) => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(file))) {
    const relative = path.relative(coreAssetsRoot, sourceAsset).replace(/\\/g, '/')
    copyFileIfChanged(sourceAsset, path.join(vendorDir, 'zelda-hyrule-ui', 'assets', relative))
  }

  const variablesSource = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'packages', 'core', 'styles', 'variables.less')
  const variablesOut = path.join(vendorDir, 'zelda-hyrule-ui', 'styles', 'variables.less')
  if (fs.existsSync(variablesSource)) copyFileIfChanged(variablesSource, variablesOut)

  for (const lessFile of walkFiles(componentsRoot, (file) => file.endsWith('.module.less'))) {
    const relative = path.relative(componentsRoot, lessFile)
    const lessOut = path.join(vendorDir, 'zelda-hyrule-ui', 'components', relative)
    ensureDir(path.dirname(lessOut))
    let variablesImport = path.relative(path.dirname(lessOut), variablesOut).replace(/\\/g, '/')
    if (!variablesImport.startsWith('.')) variablesImport = './' + variablesImport
    fs.writeFileSync(lessOut, `@import "${variablesImport}";\n${fs.readFileSync(lessFile, 'utf-8')}`)
  }

  const a11ySource = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'packages', 'react', 'src', 'utils', 'a11y.ts')
  if (fs.existsSync(a11ySource)) {
    copyFileIfChanged(a11ySource, path.join(vendorDir, 'zelda-hyrule-ui', 'utils', 'a11y.ts'))
  }

  for (const item of items) {
    const stem = item.id.split('-').at(-1)
    const sourcePath = byStem.get(stem)
    if (!sourcePath) continue
    const relative = path.relative(componentsRoot, sourcePath)
    const vendorOut = path.join(vendorDir, 'zelda-hyrule-ui', 'components', relative)
    const source = fs.readFileSync(sourcePath, 'utf-8')
    ensureDir(path.dirname(vendorOut))
    fs.writeFileSync(vendorOut, rewriteZeldaSource(source, path.dirname(vendorOut)))

    const exportName = getExportName(source)
    if (!exportName) continue
    const previewOut = path.join(previewDir, 'zelda-hyrule-ui', `${item.id}.tsx`)
    ensureDir(path.dirname(previewOut))
    let importPath = path.relative(path.dirname(previewOut), vendorOut).replace(/\\/g, '/').replace(/\.tsx$/i, '')
    if (!importPath.startsWith('.')) importPath = './' + importPath
    const componentExpr =
      exportName === 'default'
        ? 'ComponentModule.default'
        : `ComponentModule.${exportName}`
    fs.writeFileSync(
      previewOut,
      `// @ts-nocheck
import * as ComponentModule from '${importPath}'

const Component = ${componentExpr}
const previewProps = {
    variant: 'default',
    type: 'main',
    icon: 'shrine',
  value: 42,
  modifier: 'bonus',
  quality: 3,
  size: 96,
  title: 'Temple of Time',
  subtitle: 'Ancient Hyrule interface',
  text: 'Zelda Hyrule UI',
  label: 'Preview',
  description: 'Generated from the original React component source.',
  current: 7,
  max: 10,
  total: 12,
  count: 5,
  amount: 320,
  temperature: 23,
  weather: 'sunny',
  active: true,
  selected: true,
  progress: 68,
  onClick: () => {},
  actions: [
    { id: 'jump', label: 'Jump', button: 'A', icon: 'A' },
    { id: 'attack', label: 'Attack', button: 'Y', icon: 'Y' },
  ],
  cards: [
    { id: 'c1', title: 'Master Sword', description: 'Legendary blade', image: '', color: '#38bdf8' },
    { id: 'c2', title: 'Hylian Shield', description: 'Ancient shield', image: '', color: '#fbbf24' },
  ],
  hearts: Array.from({ length: 10 }, (_, index) => ({ id: index, filled: index < 7 })),
  items: [
    { id: 'master-sword', name: 'Master Sword', title: 'Master Sword', value: 30, selected: true },
    { id: 'hylian-shield', name: 'Hylian Shield', title: 'Hylian Shield', value: 90 },
  ],
  quests: [
    { id: 'q1', title: 'Recover the Master Sword', type: 'main', completed: false },
    { id: 'q2', title: 'Seek the shrine', type: 'shrine', completed: true },
  ],
}

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-[#061816] text-[#d8f6ff]' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-[#061816] p-8 text-[#d8f6ff]'}>
      <div style={compact ? { transform: 'scale(0.58)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>Zelda Hyrule UI</Component>
      </div>
    </div>
  )
}
`,
    )
    result.set(item.id, `./previews/zelda-hyrule-ui/${item.id}`)
  }

  return result
}

function writeShims() {
  ensureDir(shimDir)
  fs.writeFileSync(
    path.join(shimDir, 'utils.ts'),
    `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  if (!path) return ''
  if (/^https?:\\/\\//.test(path)) return path
  return path.startsWith('/') ? path : '/' + path
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1)
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'use-mouse-position.ts'),
    `import { useEffect, useState } from 'react'

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return position
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'use-prefers-reduced-motion.ts'),
    `export function usePrefersReducedMotion() {
  return false
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'use-lock-body.ts'),
    `export function useLockBody(_locked = true) {
  return undefined
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'ui-button.tsx'),
    `import type { ButtonHTMLAttributes } from 'react'
import { cn } from './utils'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('rounded-md px-3 py-2 text-sm font-medium', className)} {...props} />
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'ui-input.tsx'),
    `import type { InputHTMLAttributes } from 'react'
import { cn } from './utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('rounded-md border px-3 py-2 text-sm', className)} {...props} />
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'next-link.tsx'),
    `import type { AnchorHTMLAttributes, ReactNode } from 'react'

export default function Link({ href = '#', children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) {
  return <a href={String(href)} {...props}>{children}</a>
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'next-image.tsx'),
    `import type { ImgHTMLAttributes } from 'react'

export default function Image(props: ImgHTMLAttributes<HTMLImageElement> & { src: any; alt?: string }) {
  const src = typeof props.src === 'string' ? props.src : props.src?.src || ''
  return <img {...props} src={src} alt={props.alt || ''} />
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'font-google.ts'),
    `export function Geist() {
  return { className: 'font-sans', variable: '--font-geist' }
}
export function Inter() {
  return { className: 'font-sans', variable: '--font-inter' }
}
export function Tourney() {
  return { className: 'font-mono', variable: '--font-tourney' }
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'particles.tsx'),
    `export default function Particles() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_50%,rgba(186,230,253,.45),transparent_35%)] opacity-80" />
}
export async function initParticlesEngine(callback?: (engine: unknown) => Promise<void> | void) {
  await callback?.({})
}
export async function loadFull(_engine?: unknown) {
  return undefined
}
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'icons.tsx'),
    `import type { SVGProps } from 'react'
export const Icon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="12" r="9" /></svg>
export const Dribbble = Icon
export const Facebook = Icon
export const Linkedin = Icon
export const X = Icon
export const Icons = new Proxy({}, { get: () => Icon }) as Record<string, typeof Icon>
`,
  )
  fs.writeFileSync(
    path.join(shimDir, 'card-stack-mask-defs.tsx'),
    `export function CardStackMaskDefs() {
  return <svg width="0" height="0" aria-hidden="true"><defs /></svg>
}
export default CardStackMaskDefs
`,
  )
}

function buildAnimataGeneratedIds() {
  const animataRoot = path.join(rootDir, 'repos', 'animata', 'animata')
  const result = new Map()
  const files = walkFiles(
    animataRoot,
    (file) => file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.'),
  )

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf-8')
    if (!isSafeAnimataSource(source)) continue
    if (!/export\s+default\s+function|export\s+default\s+\w+/.test(source)) continue

    const relative = path.relative(animataRoot, filePath).replace(/\\/g, '/')
    const [category, fileName] = relative.split('/')
    if (!category || !fileName) continue

    const id = `at-${normalizeIdPart(fileName)}`
    if (READY_LOCAL_IDS.has(id)) continue

    const storyPath = path.join(path.dirname(filePath), fileName.replace(/\.tsx$/i, '.stories.tsx'))
    const previewArgs = resolveAnimataPreviewArgs(id, source, storyPath)

    const vendorOut = path.join(vendorDir, 'animata', category, fileName)
    const previewOut = path.join(previewDir, 'animata', `${id}.tsx`)
    ensureDir(path.dirname(vendorOut))
    ensureDir(path.dirname(previewOut))

    fs.writeFileSync(vendorOut, rewriteAnimataSource(source))

    const importPath = `../../vendor/animata/${category}/${fileName.replace(/\.tsx$/i, '')}`
    fs.writeFileSync(
      previewOut,
      `// @ts-nocheck
import Component from '${importPath}'

const previewProps = ${previewArgs}

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-100' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-100 p-8'}>
      <div style={compact ? { transform: 'scale(0.48)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
`,
    )

    result.set(id, `./previews/animata/${id}`)
  }

  return result
}

function findExistingModule(basePath) {
  const candidates = [
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}.css`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
    basePath,
  ]
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null
}

function buildAnimataDependencyGeneratedIds(existing = new Map()) {
  const animataRoot = path.join(rootDir, 'repos', 'animata', 'animata')
  const repoRoot = path.join(rootDir, 'repos', 'animata')
  const result = new Map(existing)
  const dataPath = path.join(dataDir, 'animata.json')
  if (!fs.existsSync(dataPath)) return result
  const items = readJson(dataPath)
  const copied = new Set()
  const generatedStylesDir = path.join(vendorDir, 'styles')
  ensureDir(generatedStylesDir)
  fs.writeFileSync(path.join(generatedStylesDir, 'globals.css'), `@import "tailwindcss";\n`)

  function vendorPathFor(sourcePath) {
    const relative = path.relative(animataRoot, sourcePath)
    return path.join(vendorDir, 'animata', relative)
  }

  function relImport(fromDir, targetPath, keepExtension = false) {
    let rel = path.relative(fromDir, targetPath).replace(/\\/g, '/')
    if (!rel.startsWith('.')) rel = './' + rel
    return keepExtension ? rel : rel.replace(/\.(tsx|ts)$/i, '')
  }

  function resolveSpecifier(specifier, sourcePath) {
    if (specifier.startsWith('@/animata/')) {
      return findExistingModule(path.join(animataRoot, specifier.replace(/^@\/animata\//, '')))
    }
    if (specifier.startsWith('@/public/')) {
      return findExistingModule(path.join(repoRoot, 'public', specifier.replace(/^@\/public\//, '')))
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      return findExistingModule(path.resolve(path.dirname(sourcePath), specifier))
    }
    return null
  }

  function copyModule(sourcePath) {
    if (!sourcePath || copied.has(sourcePath)) return sourcePath
    copied.add(sourcePath)
    const outPath = vendorPathFor(sourcePath)
    ensureDir(path.dirname(outPath))

    if (/\.css$/i.test(sourcePath)) {
      const css = fs.readFileSync(sourcePath, 'utf-8')
        .replace(/\bborder-border\b/g, 'border-slate-700')
        .replace(/\bbg-background\b/g, 'bg-slate-950')
        .replace(/\bbg-accent\/10\b/g, 'bg-slate-700/20')
        .replace(/\btext-foreground\b/g, 'text-slate-50')
      fs.writeFileSync(outPath, css)
      return sourcePath
    }

    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(sourcePath)) {
      copyFileIfChanged(sourcePath, outPath)
      return sourcePath
    }

    let source = fs.readFileSync(sourcePath, 'utf-8')
    const replacements = new Map()
    const importRegex = /import(?:[\s\S]*?)from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g
    const importedSpecifiers = [
      ...[...source.matchAll(importRegex)].map((match) => match[1] || match[2]),
      ...[...source.matchAll(/^\s*import\s+['"]([^'"]+)['"];?/gm)].map((match) => match[1]),
      ...[...source.matchAll(/export\s+(?:\{[\s\S]*?\}|\*)\s+from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]),
    ]
    for (const specifier of importedSpecifiers) {
      let replacement = null
      if (specifier === '@/lib/utils') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'utils.ts'))
      if (specifier === '@/hooks/use-mouse-position') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'use-mouse-position.ts'))
      if (specifier === '@/hooks/use-prefers-reduced-motion') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'use-prefers-reduced-motion.ts'))
      if (specifier === '@/hooks/use-lock-body') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'use-lock-body.ts'))
      if (specifier === '@/components/ui/button') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'ui-button.tsx'))
      if (specifier === '@/components/ui/input') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'ui-input.tsx'))
      if (specifier === '@/components/icons') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'icons.tsx'))
      if (specifier === '@/components/shapes/card-stack-mask-defs') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'card-stack-mask-defs.tsx'))
      if (specifier === 'next/link') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'next-link.tsx'))
      if (specifier === 'next/image') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'next-image.tsx'))
      if (specifier === 'next/font/google') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'font-google.ts'))
      if (specifier === '@tsparticles/react' || specifier === 'tsparticles') replacement = relImport(path.dirname(outPath), path.join(shimDir, 'particles.tsx'))
      if (specifier === 'lucide-react' && /\b(Dribbble|Facebook|Linkedin)\b/.test(source)) {
        replacement = relImport(path.dirname(outPath), path.join(shimDir, 'icons.tsx'))
      }
      if (!replacement) {
        const dep = resolveSpecifier(specifier, sourcePath)
        if (dep) {
          copyModule(dep)
          replacement = relImport(path.dirname(outPath), vendorPathFor(dep), /\.(css|png|jpg|jpeg|gif|webp|svg)$/i.test(dep))
        }
      }
      if (replacement) replacements.set(specifier, replacement)
    }
    for (const [from, to] of replacements) {
      source = source.replaceAll(`'${from}'`, `'${to}'`).replaceAll(`"${from}"`, `"${to}"`)
    }
    fs.writeFileSync(outPath, `// @ts-nocheck\n${source}`)
    return sourcePath
  }

  for (const item of items) {
    if (result.has(item.id) || READY_LOCAL_IDS.has(item.id)) continue
    const sourceBase = path.join(animataRoot, item.category, item.id.replace(/^at-/, ''))
    const sourcePath = fs.existsSync(path.join(sourceBase, 'index.tsx'))
      ? path.join(sourceBase, 'index.tsx')
      : findExistingModule(sourceBase)
    if (!sourcePath || !/\.(tsx|ts)$/i.test(sourcePath)) continue
    const source = fs.readFileSync(sourcePath, 'utf-8')
    const exportName = getExportName(source)
    if (!exportName) continue
    copyModule(sourcePath)
    const previewOut = path.join(previewDir, 'animata', `${item.id}.tsx`)
    ensureDir(path.dirname(previewOut))
    const importPath = relImport(path.dirname(previewOut), vendorPathFor(sourcePath))
    const componentExpr = exportName === 'default' ? 'ComponentModule.default' : `ComponentModule.${exportName}`
    const previewArgs = resolveAnimataPreviewArgs(item.id, source)
    if (item.id === 'at-card-stack') {
      fs.writeFileSync(
        previewOut,
        `// @ts-nocheck
import * as ComponentModule from '${importPath}'

const CardStack = ${componentExpr}
const cards = [
  { id: 'alpha', title: 'Alpha', description: 'First generated card' },
  { id: 'beta', title: 'Beta', description: 'Second generated card' },
  { id: 'gamma', title: 'Gamma', description: 'Third generated card' },
]

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-950 p-8 text-white'}>
      <div className="relative h-64 w-72" style={compact ? { transform: 'scale(0.62)', transformOrigin: 'center' } : undefined}>
        <CardStack items={cards} autoplay>
          <CardStack.Viewport className="relative h-full w-full">
            <CardStack.List>
              {(card: any) => (
                <CardStack.Card className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="mt-3 text-sm text-slate-500">{card.description}</p>
                </CardStack.Card>
              )}
            </CardStack.List>
            <CardStack.Trigger full aria-label="Next card" />
          </CardStack.Viewport>
        </CardStack>
      </div>
    </div>
  )
}
`,
      )
      result.set(item.id, `./previews/animata/${item.id}`)
      continue
    }
    fs.writeFileSync(
      previewOut,
      `// @ts-nocheck
import * as ComponentModule from '${importPath}'

const Component = ${componentExpr}
const previewProps = ${previewArgs}

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-950 p-8 text-white'}>
      <div style={compact ? { transform: 'scale(0.52)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>Animata Preview</Component>
      </div>
    </div>
  )
}
`,
    )
    result.set(item.id, `./previews/animata/${item.id}`)
  }

  return result
}

function buildReactBitsVideoMap() {
  const sourceDir = path.join(rootDir, 'repos', 'react-bits', 'public', 'assets', 'video')
  const targetDir = path.join(publicAssetsDir, 'react-bits', 'video')
  const result = new Map()
  if (!fs.existsSync(sourceDir)) return result

  const files = fs.readdirSync(sourceDir).filter((file) => /\.(mp4|webm)$/i.test(file))
  for (const file of files) {
    const source = path.join(sourceDir, file)
    const target = path.join(targetDir, file)
    copyFileIfChanged(source, target)

    const slug = normalizePreviewSlug(file)
    const record = result.get(slug) || {}
    const url = `/demo-assets/react-bits/video/${file}`
    if (/\.mp4$/i.test(file)) record.mp4 = url
    if (/\.webm$/i.test(file)) record.webm = url
    result.set(slug, record)
  }

  return result
}

function buildEldoraImageMap() {
  const sourceDir = path.join(rootDir, 'repos', 'eldoraui', 'apps', 'www', 'public', 'examples')
  const targetDir = path.join(publicAssetsDir, 'eldoraui', 'examples')
  const result = new Map()
  if (!fs.existsSync(sourceDir)) return result

  for (const dir of fs.readdirSync(sourceDir)) {
    const source = path.join(sourceDir, dir, 'dark.png')
    if (!fs.existsSync(source)) continue
    const target = path.join(targetDir, dir, 'dark.png')
    copyFileIfChanged(source, target)
    const src = `/demo-assets/eldoraui/examples/${dir}/dark.png`
    result.set(`ed-example-${dir}`, src)
    result.set(`ed-official-${dir}`, src)
    if (/-demo$/.test(dir)) {
      const componentSlug = dir.replace(/-demo$/, '')
      if (!result.has(`ed-component-${componentSlug}`)) {
        result.set(`ed-component-${componentSlug}`, src)
      }
    }
  }

  return result
}

function getPreviewRecord(component, context = {}) {
  const language = component.language || component.codeSnippet?.language || 'unknown'

  if (READY_LOCAL_IDS.has(component.id)) {
    return {
      id: component.id,
      project: component.project,
      kind: 'react-generated',
      status: 'ready',
      entry: 'LocalComponentPreview',
    }
  }

  if (component.project === 'react-bits') {
    const videoMap = context.reactBitsVideoMap || new Map()
    let slug = normalizePreviewSlug(component.name)
    // For rb-official-* entries, extract slug from id
    if (component.id.startsWith('rb-official-')) {
      slug = component.id.replace('rb-official-', '')
    }
    const media = videoMap.get(slug)
    if (media?.mp4 || media?.webm) {
      return {
        id: component.id,
        project: component.project,
        kind: 'media-video',
        status: 'ready',
        media: {
          ...media,
          label: 'React Bits Official Video Demo',
        },
      }
    }
    if (component.id === 'rb-shapegridcode') {
      const fallbackPath = path.join(publicAssetsDir, 'react-bits', 'shapegrid-fallback.svg')
      ensureDir(path.dirname(fallbackPath))
      fs.writeFileSync(
        fallbackPath,
        `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#060914"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#38bdf8"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#bg)"/>
  <g transform="translate(190 78)" opacity=".95">
    ${Array.from({ length: 48 }, (_, i) => {
      const x = (i % 8) * 74
      const y = Math.floor(i / 8) * 64
      const opacity = 0.32 + ((i % 5) * 0.13)
      return `<rect x="${x}" y="${y}" width="56" height="46" rx="14" fill="url(#cell)" opacity="${opacity.toFixed(2)}" transform="rotate(${(i % 7) - 3} ${x + 28} ${y + 23})"/>`
    }).join('')}
  </g>
  <text x="480" y="482" text-anchor="middle" fill="#e5e7eb" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700">React Bits Shape Grid Demo</text>
  <text x="480" y="514" text-anchor="middle" fill="#94a3b8" font-family="Inter, Arial, sans-serif" font-size="16">Official video asset missing. Showing a local visual fallback.</text>
</svg>`,
      )
      return {
        id: component.id,
        project: component.project,
        kind: 'media-image',
        status: 'ready',
        media: {
          poster: '/demo-assets/react-bits/shapegrid-fallback.svg',
          label: 'React Bits Local Visual Fallback',
        },
      }
    }
  }

  if (component.project === 'eldoraui') {
    const imageMap = context.eldoraImageMap || new Map()
    const image = imageMap.get(component.id)
    if (image) {
      return {
        id: component.id,
        project: component.project,
        kind: 'media-image',
        status: 'ready',
        media: {
          poster: image,
          label: 'Eldora UI Official Example Screenshot',
        },
      }
    }
  }

  if (language === 'html') {
    return {
      id: component.id,
      project: component.project,
      kind: 'html-live',
      status: 'ready',
    }
  }

  if (component.project === 'animejs' || language === 'js' || language === 'javascript') {
    return {
      id: component.id,
      project: component.project,
      kind: 'js-demo',
      status: 'ready',
    }
  }

  const reason =
    component.project === 'react-bits'
      ? 'react-bits 当前数据源仍是 raw 配置对象，需重新提取真实组件源码和 usage 后生成预览'
      : 'Local preview wrapper has not been generated for this React/TSX component yet.'

  return {
    id: component.id,
    project: component.project,
    kind: 'unsupported',
    status: 'unsupported',
    reason,
  }
}

function toTsString(value) {
  return JSON.stringify(value, null, 2)
}

function main() {
  ensureDir(generatedDir)
  fs.rmSync(previewDir, { recursive: true, force: true })
  fs.rmSync(vendorDir, { recursive: true, force: true })
  writeShims()

  const animataGeneratedIds = buildAnimataDependencyGeneratedIds(buildAnimataGeneratedIds())
  const generatedPreviewIds = new Map([
    ...animataGeneratedIds,
    ...buildEldoraGeneratedIds(),
    ...buildZeldaGeneratedIds(),
  ])
  const reactBitsVideoMap = buildReactBitsVideoMap()
  const eldoraImageMap = buildEldoraImageMap()

  const indexPath = path.join(dataDir, 'index.json')
  const index = readJson(indexPath)
  const records = index.components.map((component) => {
    const record = getPreviewRecord(component, { reactBitsVideoMap, eldoraImageMap })
    if (
      record.kind === 'unsupported' &&
      (component.project === 'animata' || component.project === 'eldoraui' || component.project === 'zelda-hyrule-ui') &&
      generatedPreviewIds.has(component.id)
    ) {
      return {
        id: component.id,
        project: component.project,
        kind: 'react-generated',
        status: 'ready',
        entry: generatedPreviewIds.get(component.id),
      }
    }
    return record
  })

  const byId = Object.fromEntries(records.map((record) => [record.id, record]))
  const stats = records.reduce((acc, record) => {
    const key = `${record.status}:${record.kind}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const manifestTs = `import type { PreviewManifestRecord } from './preview-types'

export const previewManifest: Record<string, PreviewManifestRecord> = ${toTsString(byId)}

export const previewStats = ${toTsString(stats)} as const

export function getPreviewRecord(id: string | null | undefined): PreviewManifestRecord | undefined {
  if (!id) return undefined
  return previewManifest[id]
}
`

  const registryEntries = [
    ...Array.from(READY_LOCAL_IDS).map(
      (id) => `  ${JSON.stringify(id)}: () => import('../components/LocalComponentPreview'),`,
    ),
    ...Array.from(generatedPreviewIds.entries()).map(
      ([id, importPath]) => `  ${JSON.stringify(id)}: () => import(${JSON.stringify(importPath)}),`,
    ),
  ]

  const registryTs = `import type { ComponentType } from 'react'
import type { ComponentEntry, ComponentSummary } from '../types'

export type GeneratedPreviewComponent = ComponentType<{
  component: Pick<ComponentEntry, 'id'> | ComponentSummary
  compact?: boolean
}>

export const previewRegistry: Record<string, () => Promise<{ default: GeneratedPreviewComponent }>> = {
${registryEntries.join('\n')}
}

export function hasGeneratedPreview(id: string | null | undefined): boolean {
  return Boolean(id && previewRegistry[id])
}
`

  const publicManifestPath = path.join(dataDir, 'preview-manifest.json')
  fs.writeFileSync(publicManifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), stats, records }, null, 2))
  fs.writeFileSync(path.join(generatedDir, 'preview-manifest.ts'), manifestTs)
  fs.writeFileSync(path.join(generatedDir, 'preview-registry.ts'), registryTs)

  console.log('=== Preview Generation Results ===')
  for (const [key, value] of Object.entries(stats).sort()) {
    console.log(`  ${key}: ${value}`)
  }
  console.log(`\nManifest: ${publicManifestPath}`)
  console.log(`Registry: ${path.join(generatedDir, 'preview-registry.ts')}`)
}

main()
