import type { ProjectMeta } from '../types'

export const projects: ProjectMeta[] = [
  {
    id: 'react-bits',
    name: 'React Bits',
    github: 'https://github.com/DavidHDev/react-bits',
    demoBaseUrl: 'https://reactbits.dev',
    description: '最大的 React 动画组件库，130+ 文本动画、UI 组件和背景效果，支持 JS/TS + CSS/Tailwind 四种变体。',
    accentColor: '#6366F1',
    tags: ['react', 'animation', 'components', 'text-effects', 'backgrounds'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'CSS'],
    category: 'animation',
  },
  {
    id: 'animejs',
    name: 'Anime.js',
    github: 'https://github.com/juliangarnier/anime',
    demoBaseUrl: 'https://animejs.com',
    description: '轻量级 JavaScript 动画引擎，支持 CSS 属性、SVG、DOM 属性和 JS 对象动画，API 简洁强大。',
    accentColor: '#FF4B4B',
    tags: ['javascript', 'animation-engine', 'svg', 'dom'],
    techStack: ['JavaScript', 'ESM', 'UMD'],
    category: 'animation',
  },
  {
    id: 'uiverse',
    name: 'Uiverse',
    github: 'https://github.com/uiverse-io/galaxy',
    demoBaseUrl: 'https://uiverse.io',
    description: '最大的开源 UI 元素库，社区驱动，3000+ 纯 CSS/HTML/Tailwind 组件，即拷即用。',
    accentColor: '#10B981',
    tags: ['css', 'html', 'community', 'buttons', 'cards', 'inputs'],
    techStack: ['HTML', 'CSS', 'Tailwind CSS'],
    category: 'ui-library',
  },
  {
    id: 'animata',
    name: 'Animata',
    github: 'https://github.com/codse/animata',
    demoBaseUrl: 'https://animata.design',
    description: '精心制作的手写交互动画和视觉效果集合，基于 TailwindCSS 和 React，复制粘贴即可使用。',
    accentColor: '#F59E0B',
    tags: ['react', 'tailwind', 'framer-motion', 'interactions', 'effects'],
    techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
    category: 'effect',
  },
  {
    id: 'eldoraui',
    name: 'Eldora UI',
    github: 'https://github.com/karthikmudunuri/eldoraui',
    demoBaseUrl: 'https://eldoraui.site',
    description: '面向设计工程师的 React UI 库，基于 Next.js + TailwindCSS，Monorepo 架构，注重设计品质。',
    accentColor: '#8B5CF6',
    tags: ['react', 'nextjs', 'tailwind', 'design-engineers', 'monorepo'],
    techStack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
    category: 'ui-library',
  },
  {
    id: 'zelda-hyrule-ui',
    name: 'Zelda Hyrule UI',
    github: 'https://github.com/chaos-xxl/zelda-hyrule-ui',
    demoBaseUrl: 'https://chaos-xxl.github.io/zelda-hyrule-ui',
    description: '受《塞尔达传说：旷野之息》启发的 React UI 组件库，83 个组件，暗色主题 + 希卡之石辉光效果。',
    accentColor: '#3CD3FC',
    tags: ['react', 'game-ui', 'zelda', 'dark-theme', 'sheikah'],
    techStack: ['React', 'Vite', 'Less', 'TypeScript'],
    category: 'ui-library',
  },
  {
    id: 'pixel2motion',
    name: 'Pixel2Motion',
    github: 'https://github.com/nolangz/pixel2motion',
    demoBaseUrl: 'https://nolangz.github.io/pixel2motion',
    description: 'AI Logo 动画工具，将像素 Logo 转为平滑 SVG 并生成品牌动效，输出 HTML/CSS/SVG 动画展示。',
    accentColor: '#EC4899',
    tags: ['python', 'svg', 'logo-animation', 'ai-tool', 'motion'],
    techStack: ['Python', 'SVG', 'CSS Animation'],
    category: 'tool',
  },
]

export const allTechStacks = Array.from(
  new Set(projects.flatMap((p) => p.techStack))
).sort()

export const allTags = Array.from(
  new Set(projects.flatMap((p) => p.tags))
).sort()

export const allCategories = Array.from(
  new Set(projects.map((p) => p.category))
).sort()
