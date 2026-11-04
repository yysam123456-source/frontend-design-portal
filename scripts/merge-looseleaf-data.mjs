/**
 * 把 Looseleaf 的 123 个组件合并进门户数据层。
 *
 * 为什么单独合并、不跑整条 extract-components：
 * extract-components.mjs 会重新扫描 repos/ 下所有项目，当前仓库快照与已发布数据并不一致
 * （例如 zelda 93→84、eldora 161→104），整条重跑会让门户既有组件数回退。
 * 本脚本只增量写入 looseleaf 一个项目，先删旧条目再追加，可反复运行。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const REPO = path.join(ROOT, 'repos', 'kevintngo', 'looseleaf')
const DATA = path.join(ROOT, 'public', 'data')
const INDEX = path.join(DATA, 'index.json')
const PROJECT = 'looseleaf'

const toCategory = (value) =>
  String(value || 'Layout')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
const toTitle = (name) =>
  name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

function buildEntries() {
  const registryPath = path.join(REPO, 'registry.json')
  if (!fs.existsSync(registryPath)) throw new Error(`缺少 ${registryPath}`)

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  const uiDir = path.join(REPO, 'src', 'components', 'ui')
  const examplesDir = path.join(REPO, 'src', 'docs', 'examples')
  const examplesOut = path.join(ROOT, 'src', 'looseleaf', 'examples')

  const entries = []
  for (const item of registry.items) {
    if (item.type !== 'registry:ui') continue
    const slug = item.name
    if (!fs.existsSync(path.join(examplesDir, slug))) continue
    // 预览入口只收录成功生成的示例，避免卡片点开是空白
    if (!fs.existsSync(path.join(examplesOut, `${slug}.tsx`))) continue

    const uiFile = path.join(uiDir, `${slug}.tsx`)
    const source = fs.existsSync(uiFile) ? fs.readFileSync(uiFile, 'utf8') : ''
    const category = toCategory(item.categories?.[0])
    const previewUrl = `/looseleaf-preview.html?s=${slug}`

    entries.push({
      id: `${PROJECT}-${slug}`,
      project: PROJECT,
      name: item.title || toTitle(slug),
      category,
      style: Array.from(new Set(['hand-drawn', 'sketch', 'looseleaf', category])),
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
      description: item.description || `${item.title || toTitle(slug)} — hand-drawn UI component.`,
      language: 'tsx',
      previewUrl,
      demoUrl: previewUrl,
      codeSnippet: {
        language: 'tsx',
        source,
        dependencies: item.dependencies || [],
      },
    })
  }
  return entries
}

function main() {
  const entries = buildEntries()
  if (!entries.length) throw new Error('未生成任何 Looseleaf 条目')

  fs.writeFileSync(path.join(DATA, `${PROJECT}.json`), JSON.stringify(entries, null, 2))

  const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
  const others = index.components.filter((item) => item.project !== PROJECT)
  const summaries = entries.map((item) => ({
    id: item.id,
    project: item.project,
    name: item.name,
    category: item.category,
    style: item.style,
    techStack: item.techStack,
    description: item.description,
    language: item.codeSnippet.language,
    previewUrl: item.previewUrl,
  }))

  index.components = [...others, ...summaries]
  index.stats = { ...index.stats, [PROJECT]: entries.length }
  index.total = index.components.length
  if (!index.projects.includes(PROJECT)) index.projects.push(PROJECT)

  fs.writeFileSync(INDEX, JSON.stringify(index, null, 2))

  const categories = {}
  for (const item of entries) categories[item.category] = (categories[item.category] || 0) + 1

  console.log(`[looseleaf] 写入 ${entries.length} 条组件，门户总计 ${index.total} 条`)
  console.log('[looseleaf] 分类：', JSON.stringify(categories))
}

main()
