// 通过 GitHub API 获取未成功克隆的仓库组件
import fs from 'fs'

const TOKEN = process.env.GITHUB_TOKEN || ''

async function fetchGitHub(owner, repo, path = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'frontend-portal',
  }
  if (TOKEN) headers['Authorization'] = `token ${TOKEN}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    console.error(`Failed: ${url} - ${res.status}`)
    return null
  }
  return res.json()
}

async function fetchFileContent(owner, repo, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'frontend-portal',
  }
  if (TOKEN) headers['Authorization'] = `token ${TOKEN}`

  const res = await fetch(url, { headers })
  if (!res.ok) return null
  const data = await res.json()
  if (data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return null
}

// ============ Zelda Hyrule UI ============
async function extractZeldaFromAPI() {
  const components = []
  const owner = 'chaos-xxl'
  const repo = 'zelda-hyrule-ui'

  // 获取 src/components 目录
  const rootItems = await fetchGitHub(owner, repo, 'src/components')
  if (!rootItems || !Array.isArray(rootItems)) {
    console.log('zelda-hyrule-ui: src/components not found, trying src/')
    const srcItems = await fetchGitHub(owner, repo, 'src')
    if (!srcItems || !Array.isArray(srcItems)) {
      console.log('zelda-hyrule-ui: src not found')
      return components
    }
    for (const item of srcItems) {
      if (item.type === 'dir') {
        const files = await fetchGitHub(owner, repo, item.path)
        if (files && Array.isArray(files)) {
          for (const file of files) {
            if (file.name.endsWith('.tsx') && !file.name.includes('.test.') && !file.name.includes('.spec.')) {
              const code = await fetchFileContent(owner, repo, file.path)
              if (code) {
                components.push({
                  id: `zh-${file.name.replace('.tsx', '').toLowerCase()}`,
                  project: 'zelda-hyrule-ui',
                  name: file.name.replace('.tsx', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  category: item.name.toLowerCase(),
                  style: ['game-ui', 'zelda', 'dark'],
                  techStack: ['React', 'Less', 'TypeScript'],
                  description: `塞尔达风格 ${file.name.replace('.tsx', '')} 组件`,
                  codeSnippet: { language: 'tsx', source: code, dependencies: ['zelda-hyrule-ui'] },
                })
              }
            }
          }
        }
      }
    }
    return components
  }

  // src/components 存在
  for (const categoryItem of rootItems) {
    if (categoryItem.type !== 'dir') continue
    const files = await fetchGitHub(owner, repo, categoryItem.path)
    if (!files || !Array.isArray(files)) continue

    for (const file of files) {
      if (file.name.endsWith('.tsx') && !file.name.includes('.test.') && !file.name.includes('.spec.')) {
        const code = await fetchFileContent(owner, repo, file.path)
        if (code) {
          components.push({
            id: `zh-${file.name.replace('.tsx', '').toLowerCase()}`,
            project: 'zelda-hyrule-ui',
            name: file.name.replace('.tsx', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: categoryItem.name.toLowerCase(),
            style: ['game-ui', 'zelda', 'dark'],
            techStack: ['React', 'Less', 'TypeScript'],
            description: `塞尔达风格 ${file.name.replace('.tsx', '')} 组件`,
            codeSnippet: { language: 'tsx', source: code, dependencies: ['zelda-hyrule-ui'] },
          })
        }
      }
    }
  }

  return components
}

// ============ Eldora UI ============
async function extractEldoraFromAPI() {
  const components = []
  const owner = 'karthikmudunuri'
  const repo = 'eldoraui'

  // 尝试几个常见路径
  const possiblePaths = [
    'apps/www/components',
    'components',
    'src/components',
    'packages/ui/src/components',
    'registry',
  ]

  for (const basePath of possiblePaths) {
    const items = await fetchGitHub(owner, repo, basePath)
    if (!items || !Array.isArray(items)) continue

    for (const item of items) {
      if (item.type !== 'dir') continue
      const files = await fetchGitHub(owner, repo, item.path)
      if (!files || !Array.isArray(files)) continue

      for (const file of files) {
        if (file.name.endsWith('.tsx') && !file.name.includes('.test.') && !file.name.includes('.spec.')) {
          const code = await fetchFileContent(owner, repo, file.path)
          if (code) {
            components.push({
              id: `ed-${file.name.replace('.tsx', '').toLowerCase()}`,
              project: 'eldoraui',
              name: file.name.replace('.tsx', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              category: item.name.toLowerCase(),
              style: ['react', 'tailwind', 'modern'],
              techStack: ['React', 'Next.js', 'Tailwind CSS'],
              description: `${file.name.replace('.tsx', '')} UI 组件`,
              codeSnippet: { language: 'tsx', source: code, dependencies: [] },
            })
          }
        }
      }
    }

    if (components.length > 0) break
  }

  return components
}

// ============ Anime.js examples ============
async function extractAnimeExamplesFromAPI() {
  const components = []
  const owner = 'juliangarnier'
  const repo = 'anime'

  // 获取文档中的示例
  const docItems = await fetchGitHub(owner, repo, 'documentation')
  if (docItems && Array.isArray(docItems)) {
    // anime.js 主要是引擎，我们添加几个代表性示例
    components.push({
      id: 'aj-stagger',
      project: 'animejs',
      name: 'Stagger Animation',
      category: 'animation',
      style: ['stagger', 'dom', 'transform'],
      techStack: ['JavaScript', 'ESM'],
      description: 'Anime.js 错开动画效果',
      codeSnippet: {
        language: 'js',
        source: `import { animate, stagger } from 'animejs'

animate('.square', {
  x: 320,
  rotate: { from: -180 },
  duration: 1250,
  delay: stagger(65, { from: 'center' }),
  ease: 'inOutQuint',
  loop: true,
  alternate: true
})`,
        dependencies: ['animejs'],
      },
    })
  }

  return components
}

// ============ 主流程 ============
console.log('Fetching missing repos via GitHub API...\n')

const zeldaComponents = await extractZeldaFromAPI()
console.log(`zelda-hyrule-ui: ${zeldaComponents.length} components`)

const eldoraComponents = await extractEldoraFromAPI()
console.log(`eldoraui: ${eldoraComponents.length} components`)

const animeComponents = await extractAnimeExamplesFromAPI()
console.log(`animejs (API): ${animeComponents.length} components`)

// 读取已有的组件数据
const existingPath = 'public/data/components.json'
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'))

// 合并（去重）
const allComponents = [
  ...existing.filter(c => c.project !== 'zelda-hyrule-ui' && c.project !== 'eldoraui' && c.project !== 'animejs'),
  ...zeldaComponents,
  ...eldoraComponents,
  ...animeComponents,
]

// 统计
const stats = {}
for (const c of allComponents) {
  stats[c.project] = (stats[c.project] || 0) + 1
}

console.log('\n=== Final Results ===')
for (const [project, count] of Object.entries(stats)) {
  console.log(`  ${project}: ${count} components`)
}
console.log(`\nTotal: ${allComponents.length} components`)

// 保存
fs.writeFileSync(existingPath, JSON.stringify(allComponents, null, 2))
console.log(`\nUpdated ${existingPath}`)
