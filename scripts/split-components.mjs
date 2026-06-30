// 将 components.json 按项目拆分为多个文件，并生成索引
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'public', 'data')
const inputPath = path.join(dataDir, 'components.json')

const components = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

// 按项目分组
const byProject = {}
for (const c of components) {
  const p = c.project || 'unknown'
  if (!byProject[p]) byProject[p] = []
  byProject[p].push(c)
}

// 保存每个项目的组件列表（精简版，不含完整源码用于列表展示）
const projectSummaries = {}
const projectStats = {}

for (const [project, list] of Object.entries(byProject)) {
  projectStats[project] = list.length

  // 完整数据（含源码）用于详情/预览
  const fullPath = path.join(dataDir, `${project}.json`)
  fs.writeFileSync(fullPath, JSON.stringify(list, null, 2))

  // 摘要数据（不含源码）用于列表/筛选
  projectSummaries[project] = list.map((c) => ({
    id: c.id,
    project: c.project,
    name: c.name,
    category: c.category,
    style: c.style,
    techStack: c.techStack,
    description: c.description,
    language: c.codeSnippet?.language || 'unknown',
  }))
}

// 保存摘要索引
const indexPath = path.join(dataDir, 'index.json')
fs.writeFileSync(
  indexPath,
  JSON.stringify(
    {
      projects: Object.keys(byProject),
      stats: projectStats,
      total: components.length,
      components: Object.values(projectSummaries).flat(),
    },
    null,
    2
  )
)

console.log('=== Split Results ===')
for (const [project, count] of Object.entries(projectStats)) {
  console.log(`  ${project}: ${count} components → ${project}.json`)
}
console.log(`\nTotal: ${components.length} components`)
console.log(`Index saved to: ${indexPath}`)
