/**
 * Looseleaf 独立预览入口生成器
 *
 * 为什么用独立入口 + iframe：
 * Looseleaf 的 Tailwind v4 会注入全局 preflight、html/body 背景与手绘字体，
 * 直接把 123 个组件搬进门户 src/ 会污染主站样式；同时它依赖 radix-ui 统一包、
 * cmdk、embla、sonner、vaul 等一批运行时。用一个独立的 Vite 入口承接这些 demo，
 * CSS 与依赖都只进入该入口的 chunk，门户主站保持原样。
 *
 * 产物：
 *   src/looseleaf/vendor/{lib,ui,hooks}/      组件与 ink 引擎（import 别名改写为相对路径）
 *   src/looseleaf/examples/<slug>.tsx          每个组件一个官方示例
 *   src/looseleaf/registry.ts                  示例索引（import.meta.glob）
 *   src/looseleaf/main.tsx                     预览页入口（?s=<slug>）
 *   src/looseleaf/{looseleaf,fonts}.css        Looseleaf 样式
 *   looseleaf-preview.html                     多入口 HTML
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const REPO = path.join(ROOT, 'repos', 'kevintngo', 'looseleaf')
const OUT = path.join(ROOT, 'src', 'looseleaf')
const VENDOR = path.join(OUT, 'vendor')
const VENDOR_LIB = path.join(VENDOR, 'lib')
const VENDOR_UI = path.join(VENDOR, 'ui')
const VENDOR_HOOKS = path.join(VENDOR, 'hooks')
const EXAMPLES_OUT = path.join(OUT, 'examples')

const log = (...args) => console.log('[looseleaf]', ...args)

// vendor 是第三方源码快照，不参与门户的类型契约；仅由本入口使用。
// 加 @ts-nocheck 让门户 tsc 只检查门户自身代码，避免第三方签名差异阻断构建。
const TS_NOCHECK = '// @ts-nocheck\n'

function assertRepo() {
  const required = [
    path.join(REPO, 'registry.json'),
    path.join(REPO, 'src', 'components', 'ui'),
    path.join(REPO, 'src', 'lib'),
    path.join(REPO, 'src', 'styles', 'looseleaf.css'),
  ]
  for (const p of required) {
    if (!fs.existsSync(p)) {
      throw new Error(`Looseleaf 仓库结构缺失：${p}\n请先克隆 repos/kevintngo/looseleaf 并安装依赖。`)
    }
  }
}

function copyDir(src, dest, filter = () => true) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d, filter)
    else if (filter(s)) fs.copyFileSync(s, d)
  }
}

function relTo(fromFile, target) {
  const r = path.relative(path.dirname(fromFile), target).split(path.sep).join('/')
  return r.startsWith('.') ? r : `./${r}`
}

/**
 * 把 "@/lib/x"、"@/components/ui/x"、"@/hooks/x" 改写为相对路径。
 * 返回 null 表示该文件依赖了未搬运的模块（docs、blocks 等），需要跳过。
 */
function resolveAlias(spec, fromFile) {
  if (spec.startsWith('@/lib/')) return relTo(fromFile, VENDOR_LIB) + '/' + spec.slice('@/lib/'.length)
  if (spec.startsWith('@/components/ui/')) return relTo(fromFile, VENDOR_UI) + '/' + spec.slice('@/components/ui/'.length)
  if (spec.startsWith('@/hooks/')) return relTo(fromFile, VENDOR_HOOKS) + '/' + spec.slice('@/hooks/'.length)
  return null
}

function rewriteAliases(filePath, content) {
  let unresolved = null
  const replaced = content.replace(/(from\s+)(["'])(@\/[^"']+)\2/g, (match, prefix, quote, spec) => {
    const target = resolveAlias(spec, filePath)
    if (target === null) {
      unresolved = spec
      return match
    }
    return `${prefix}${quote}${target}${quote}`
  })
  return { content: replaced, unresolved }
}

function copyVendor() {
  fs.rmSync(OUT, { recursive: true, force: true })
  copyDir(path.join(REPO, 'src', 'lib'), VENDOR_LIB, (f) => /\.(ts|tsx)$/.test(f))
  copyDir(path.join(REPO, 'src', 'components', 'ui'), VENDOR_UI, (f) => /\.tsx?$/.test(f))
  const hooksSrc = path.join(REPO, 'src', 'hooks')
  if (fs.existsSync(hooksSrc)) {
    copyDir(hooksSrc, VENDOR_HOOKS, (f) => /\.(ts|tsx)$/.test(f))
  }

  let rewritten = 0
  const skipped = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue
      const original = fs.readFileSync(full, 'utf8')
      const { content, unresolved } = rewriteAliases(full, original)
      if (unresolved) {
        skipped.push(`${path.relative(VENDOR, full)} -> ${unresolved}`)
      }
      fs.writeFileSync(full, TS_NOCHECK + content, 'utf8')
      rewritten++
    }
  }
  walk(VENDOR)
  log(`vendor 文件 ${rewritten} 个，别名未能解析 ${skipped.length} 个`)
  if (skipped.length) console.log(skipped.slice(0, 10).join('\n'))
}

/** 每个组件挑一个官方示例：优先 01-*.tsx，且不依赖 docs/blocks 等未搬运模块 */
function pickExample(slug) {
  const dir = path.join(REPO, 'src', 'docs', 'examples', slug)
  if (!fs.existsSync(dir)) return null
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .sort((a, b) => a.localeCompare(b))

  for (const file of files) {
    const source = fs.readFileSync(path.join(dir, file), 'utf8')
    const { content, unresolved } = rewriteAliases(path.join(EXAMPLES_OUT, `${slug}.tsx`), source)
    if (!unresolved) return { file, content }
  }
  return null
}

function buildExamples() {
  fs.mkdirSync(EXAMPLES_OUT, { recursive: true })
  const registry = JSON.parse(fs.readFileSync(path.join(REPO, 'registry.json'), 'utf8'))
  const uiItems = registry.items.filter((item) => item.type === 'registry:ui')
  const picked = []
  const missing = []

  for (const item of uiItems) {
    const example = pickExample(item.name)
    if (!example) {
      missing.push(item.name)
      continue
    }
    fs.writeFileSync(path.join(EXAMPLES_OUT, `${item.name}.tsx`), TS_NOCHECK + example.content, 'utf8')
    picked.push({ slug: item.name, file: example.file })
  }

  log(`官方示例已收录 ${picked.length}/${uiItems.length}`)
  if (missing.length) console.log(`[looseleaf] 无可用示例：${missing.join(', ')}`)
  return { uiItems, picked, missing }
}

function copyStyles() {
  const styleSrc = path.join(REPO, 'src', 'styles', 'looseleaf.css')
  const fontsSrc = path.join(REPO, 'src', 'styles', 'fonts.css')
  fs.copyFileSync(styleSrc, path.join(OUT, 'looseleaf.css'))
  fs.copyFileSync(fontsSrc, path.join(OUT, 'fonts.css'))
  log('样式已拷贝（looseleaf.css / fonts.css）')
}

function writeRegistry(picked) {
  const lines = [
    '// 由 scripts/generate-looseleaf-preview.mjs 生成，请勿手改。',
    '// 每个 key 对应 src/looseleaf/examples/<slug>.tsx，按需动态加载。',
    "import type { ComponentType } from 'react'",
    "export const looseleafExamples = import.meta.glob('./examples/*.tsx') as Record<string, () => Promise<{ default: ComponentType }>>",
    '',
    `export const looseleafSlugs = ${JSON.stringify(picked.map((p) => p.slug), null, 0)}`,
    '',
  ]
  fs.writeFileSync(path.join(OUT, 'registry.ts'), lines.join('\n'), 'utf8')
}

function writePreviewEntry() {
  const main = `import { useEffect, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './looseleaf.css'
import './preview.css'
import { looseleafExamples } from './registry'

type ExampleComponent = ComponentType

function Preview() {
  const [slug] = useState(() => new URLSearchParams(location.search).get('s') || 'button')
  const [Example, setExample] = useState<ExampleComponent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = looseleafExamples[\`./examples/\${slug}.tsx\`]
    if (!loader) {
      setError(\`Unknown Looseleaf example: \${slug}\`)
      return
    }
    let mounted = true
    loader()
      .then((mod) => {
        if (mounted) setExample(() => mod.default)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      mounted = false
    }
  }, [slug])

  if (error) {
    return (
      <div data-ll-scope className="ll-stage">
        <p className="ll-stage-error">{error}</p>
      </div>
    )
  }

  return (
    <div data-ll-scope data-density="comfortable" className="ll-stage">
      <div className="ll-demo">{Example ? <Example /> : null}</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
`
  fs.writeFileSync(path.join(OUT, 'main.tsx'), main, 'utf8')

  const css = `/* 预览页外壳：只负责把 demo 摆到纸面上，组件样式全部来自 looseleaf.css */
html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--ll-paper, #f8f5ee);
}

.ll-stage {
  box-sizing: border-box;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  color: var(--foreground, #2a2420);
  font-family: var(--font-hand, system-ui, sans-serif);
  background-color: var(--ll-paper, #f8f5ee);
}

.ll-demo {
  max-width: 100%;
}

.ll-stage-error {
  margin: 0;
  font-size: 13px;
  color: var(--ll-red, #b3261e);
}
`
  fs.writeFileSync(path.join(OUT, 'preview.css'), css, 'utf8')

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Looseleaf Component Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/looseleaf/main.tsx"></script>
  </body>
</html>
`
  fs.writeFileSync(path.join(ROOT, 'looseleaf-preview.html'), html, 'utf8')
  log('预览入口已生成：looseleaf-preview.html + src/looseleaf/main.tsx')
}

function main() {
  assertRepo()
  copyVendor()
  const { picked } = buildExamples()
  copyStyles()
  writeRegistry(picked)
  writePreviewEntry()
  log('完成')
}

main()
