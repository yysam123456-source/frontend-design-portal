import type { ProjectMeta } from '../types'

export const projects: ProjectMeta[] = [
  {
    id: 'react-bits',
    name: 'React Bits',
    github: 'https://github.com/DavidHDev/react-bits',
    demoBaseUrl: 'https://reactbits.dev',
    description: 'A large React animation component library with 130+ text effects, UI components, and animated backgrounds across JS/TS and CSS/Tailwind variants.',
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
    description: 'A lightweight JavaScript animation engine for CSS properties, SVG, DOM attributes, and JavaScript objects with a concise API.',
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
    description: 'A community-driven open-source UI element library with 3,000+ copy-ready CSS, HTML, and Tailwind components.',
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
    description: 'A curated collection of handcrafted interactions and visual effects built with Tailwind CSS and React.',
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
    description: 'A React UI library for design engineers, built with Next.js and Tailwind CSS in a monorepo architecture.',
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
    description: 'A Breath of the Wild-inspired React UI component library with 83 dark-theme components and Sheikah-style glow effects.',
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
    description: 'An AI logo animation tool that converts pixel logos into smooth SVG artwork and brand motion demos.',
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
