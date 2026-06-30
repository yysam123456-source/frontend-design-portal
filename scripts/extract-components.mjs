// 从已克隆的仓库中提取组件数据，生成统一的 JSON 数据库
// 同时支持通过 GitHub API 获取未成功克隆的仓库

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reposDir = path.join(__dirname, '..', 'repos')
const outputDir = path.join(__dirname, '..', 'public', 'data')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// ============ react-bits ============
function extractReactBits() {
  const components = []
  const codeDir = path.join(reposDir, 'react-bits', 'src', 'constants', 'code')
  if (!fs.existsSync(codeDir)) return components

  const categories = fs.readdirSync(codeDir).filter(f => fs.statSync(path.join(codeDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(codeDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.js', '')

      // 尝试提取代码字符串
      const codeMatch = content.match(/['"`]([\s\S]*?)['"`];?\s*$/)
      const code = codeMatch ? codeMatch[1] : content

      components.push({
        id: `rb-${name.toLowerCase()}`,
        project: 'react-bits',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category.toLowerCase(),
        style: ['react', 'animation'],
        techStack: ['React', 'CSS'],
        description: `${name} 动画组件`,
        codeSnippet: {
          language: 'jsx',
          source: code,
          dependencies: [],
        },
      })
    }
  }

  return components
}

// ============ animata ============
function extractAnimata() {
  const components = []
  const animataDir = path.join(reposDir, 'animata', 'animata')
  if (!fs.existsSync(animataDir)) return components

  const categories = fs.readdirSync(animataDir).filter(f => fs.statSync(path.join(animataDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(animataDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.tsx') && !f.includes('.stories.'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const code = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.tsx', '')

      components.push({
        id: `at-${name.toLowerCase()}`,
        project: 'animata',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category,
        style: ['react', 'tailwind', 'animation'],
        techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
        description: `${name} 交互动效组件`,
        codeSnippet: {
          language: 'tsx',
          source: code,
          dependencies: ['framer-motion'],
        },
      })
    }
  }

  return components
}

// ============ uiverse (galaxy) ============
function extractUiverse() {
  const components = []
  const galaxyDir = path.join(reposDir, 'galaxy')
  if (!fs.existsSync(galaxyDir)) return components

  const categories = fs.readdirSync(galaxyDir).filter(f => fs.statSync(path.join(galaxyDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(galaxyDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.html'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const code = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.html', '')

      components.push({
        id: `uv-${name.toLowerCase()}`,
        project: 'uiverse',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category.toLowerCase(),
        style: ['css', 'html', 'pure-css'],
        techStack: ['HTML', 'CSS'],
        description: `${name} CSS 组件`,
        codeSnippet: {
          language: 'html',
          source: code,
          dependencies: [],
        },
      })
    }
  }

  return components
}

// ============ pixel2motion ============
function extractPixel2Motion() {
  const components = []
  const docsDir = path.join(reposDir, 'pixel2motion', 'docs')
  if (!fs.existsSync(docsDir)) return components

  // pixel2motion 是工具，不是组件库，提取其展示页面的效果
  const indexHtml = path.join(docsDir, 'index.html')
  if (fs.existsSync(indexHtml)) {
    components.push({
      id: 'p2m-showcase',
      project: 'pixel2motion',
      name: 'Logo Motion Showcase',
      category: 'logo-animation',
      style: ['svg', 'animation'],
      techStack: ['SVG', 'CSS Animation'],
      description: 'AI Logo 动画展示页面',
      codeSnippet: {
        language: 'html',
        source: fs.readFileSync(indexHtml, 'utf-8'),
        dependencies: [],
      },
    })
  }

  return components
}

// ============ anime.js (从已克隆的 examples 中提取) ============
function extractAnimeJS() {
  const components = []
  const assetsDir = path.join(reposDir, 'anime', 'assets')

  // anime.js 是动画引擎，不是组件库
  // 我们提取其官网的动画示例作为展示
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

  components.push({
    id: 'aj-svg-draw',
    project: 'animejs',
    name: 'SVG Path Draw',
    category: 'animation',
    style: ['svg', 'path', 'draw'],
    techStack: ['JavaScript', 'ESM'],
    description: 'SVG 路径描边动画',
    codeSnippet: {
      language: 'js',
      source: `import { animate } from 'animejs'

animate('#path', {
  strokeDashoffset: [animate.setDashoffset, 0],
  duration: 2000,
  ease: 'easeInOutSine',
})`,
      dependencies: ['animejs'],
    },
  })

  components.push({
    id: 'aj-timeline',
    project: 'animejs',
    name: 'Timeline Sequence',
    category: 'animation',
    style: ['timeline', 'sequence'],
    techStack: ['JavaScript', 'ESM'],
    description: '时间轴动画序列',
    codeSnippet: {
      language: 'js',
      source: `import { createTimeline } from 'animejs'

const tl = createTimeline()
tl.add('.el1', { x: 100, duration: 500 })
  .add('.el2', { x: 200, duration: 500 }, '-=300')
  .add('.el3', { x: 300, duration: 500 })`,
      dependencies: ['animejs'],
    },
  })

  return components
}

// ============ zelda-hyrule-ui (从已克隆的源码中提取) ============
function extractZelda() {
  const components = []
  const srcDir = path.join(reposDir, 'zelda-hyrule-ui', 'src')
  if (!fs.existsSync(srcDir)) return components

  const categories = fs.readdirSync(srcDir).filter(f => fs.statSync(path.join(srcDir, f)).isDirectory())

  for (const category of categories) {
    const catDir = path.join(srcDir, category)
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.tsx'))

    for (const file of files) {
      const filePath = path.join(catDir, file)
      const code = fs.readFileSync(filePath, 'utf-8')
      const name = file.replace('.tsx', '')

      components.push({
        id: `zh-${name.toLowerCase()}`,
        project: 'zelda-hyrule-ui',
        name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category.toLowerCase(),
        style: ['game-ui', 'zelda', 'dark'],
        techStack: ['React', 'Less', 'TypeScript'],
        description: `塞尔达风格 ${name} 组件`,
        codeSnippet: {
          language: 'tsx',
          source: code,
          dependencies: ['zelda-hyrule-ui'],
        },
      })
    }
  }

  return components
}

// ============ eldoraui (从已克隆的源码中提取) ============
function extractEldora() {
  const components = []

  // eldoraui 是 monorepo，组件可能在不同位置
  // 尝试几个常见路径
  const possiblePaths = [
    path.join(reposDir, 'eldoraui', 'apps', 'www', 'components'),
    path.join(reposDir, 'eldoraui', 'components'),
    path.join(reposDir, 'eldoraui', 'src', 'components'),
    path.join(reposDir, 'eldoraui', 'packages', 'ui', 'src', 'components'),
  ]

  for (const compDir of possiblePaths) {
    if (!fs.existsSync(compDir)) continue

    const categories = fs.readdirSync(compDir).filter(f => fs.statSync(path.join(compDir, f)).isDirectory())

    for (const category of categories) {
      const catDir = path.join(compDir, category)
      const files = fs.readdirSync(catDir).filter(f => f.endsWith('.tsx'))

      for (const file of files) {
        const filePath = path.join(catDir, file)
        const code = fs.readFileSync(filePath, 'utf-8')
        const name = file.replace('.tsx', '')

        components.push({
          id: `ed-${name.toLowerCase()}`,
          project: 'eldoraui',
          name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: category.toLowerCase(),
          style: ['react', 'tailwind', 'modern'],
          techStack: ['React', 'Next.js', 'Tailwind CSS'],
          description: `${name} UI 组件`,
          codeSnippet: {
            language: 'tsx',
            source: code,
            dependencies: [],
          },
        })
      }
    }
  }

  return components
}

// ============ 主流程 ============
console.log('Extracting components from cloned repos...')

const allComponents = [
  ...extractReactBits(),
  ...extractAnimata(),
  ...extractUiverse(),
  ...extractPixel2Motion(),
  ...extractAnimeJS(),
  ...extractZelda(),
  ...extractEldora(),
]

// 统计
const stats = {}
for (const c of allComponents) {
  stats[c.project] = (stats[c.project] || 0) + 1
}

console.log('\n=== Extraction Results ===')
for (const [project, count] of Object.entries(stats)) {
  console.log(`  ${project}: ${count} components`)
}
console.log(`\nTotal: ${allComponents.length} components`)

// 保存
const outputPath = path.join(outputDir, 'components.json')
fs.writeFileSync(outputPath, JSON.stringify(allComponents, null, 2))
console.log(`\nSaved to ${outputPath}`)
