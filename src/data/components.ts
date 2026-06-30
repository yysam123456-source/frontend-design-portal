import type { ComponentEntry } from '../types'

export const componentData: Record<string, ComponentEntry[]> = {
  'react-bits': [
    {
      id: 'rb-blurtext',
      project: 'react-bits',
      name: 'BlurText',
      category: 'text-animation',
      style: ['blur', 'reveal', 'typography'],
      techStack: ['React', 'TypeScript', 'Tailwind CSS'],
      description: '文字逐字模糊显现动画，支持自定义模糊强度和延迟。',
      demoUrl: 'https://reactbits.dev/text-animations/blur-text',
      codeSnippet: {
        language: 'tsx',
        source: `import { BlurText } from '@react-bits/BlurText-TS-TW'

export default function App() {
  return (
    <BlurText
      text="Hello World"
      delay={150}
      animateBy="words"
      direction="top"
      className="text-2xl mb-8"
    />
  )
}`,
        dependencies: ['@react-bits/BlurText-TS-TW'],
      },
    },
    {
      id: 'rb-decodedtext',
      project: 'react-bits',
      name: 'DecodedText',
      category: 'text-animation',
      style: ['scramble', 'decode', 'cyberpunk'],
      techStack: ['React', 'TypeScript', 'CSS'],
      description: '文字逐字解码动画，带有赛博朋克风格的字符扰动效果。',
      demoUrl: 'https://reactbits.dev/text-animations/decoded-text',
      codeSnippet: {
        language: 'tsx',
        source: `import { DecodedText } from '@react-bits/DecodedText-TS-CSS'

export default function App() {
  return (
    <DecodedText
      text="System Online"
      interval={50}
      className="font-mono text-green-400"
    />
  )
}`,
        dependencies: ['@react-bits/DecodedText-TS-CSS'],
      },
    },
    {
      id: 'rb-grainient',
      project: 'react-bits',
      name: 'Grainient',
      category: 'background',
      style: ['gradient', 'grain', 'noise'],
      techStack: ['React', 'TypeScript', 'CSS'],
      description: '带颗粒噪点纹理的渐变背景组件，营造复古胶片质感。',
      demoUrl: 'https://reactbits.dev/backgrounds/grainient',
      codeSnippet: {
        language: 'tsx',
        source: `import { Grainient } from '@react-bits/Grainient-TS-CSS'

export default function App() {
  return (
    <Grainient
      colors={['#FF4D00', '#FF7A3D', '#FFB380']}
      speed={0.5}
      className="w-full h-screen"
    />
  )
}`,
        dependencies: ['@react-bits/Grainient-TS-CSS'],
      },
    },
  ],
  'animejs': [
    {
      id: 'aj-basic',
      project: 'animejs',
      name: 'Basic Animation',
      category: 'animation',
      style: ['ease', 'transform', 'dom'],
      techStack: ['JavaScript', 'ESM'],
      description: '基础的 DOM 元素位移动画，展示 Anime.js 简洁的 API。',
      demoUrl: 'https://animejs.com/documentation/#staggeringBasics',
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
    },
    {
      id: 'aj-svg',
      project: 'animejs',
      name: 'SVG Path Animation',
      category: 'animation',
      style: ['svg', 'path', 'draw'],
      techStack: ['JavaScript', 'ESM'],
      description: 'SVG 路径描边动画，支持 stroke-dashoffset 动画。',
      demoUrl: 'https://animejs.com/documentation/#svgMotionPath',
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
    },
  ],
  'uiverse': [
    {
      id: 'uv-button',
      project: 'uiverse',
      name: 'Neon Button',
      category: 'button',
      style: ['neon', 'glow', 'hover'],
      techStack: ['HTML', 'CSS'],
      description: '霓虹发光按钮效果，悬停时产生辉光扩散动画。',
      demoUrl: 'https://uiverse.io/buttons',
      codeSnippet: {
        language: 'html',
        source: `<button class="neon-button">
  Hover Me
</button>

<style>
.neon-button {
  padding: 12px 24px;
  background: transparent;
  border: 2px solid #00f3ff;
  color: #00f3ff;
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
}
.neon-button:hover {
  background: #00f3ff;
  color: #000;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.6);
}
</style>`,
        dependencies: [],
      },
    },
    {
      id: 'uv-card',
      project: 'uiverse',
      name: 'Glass Card',
      category: 'card',
      style: ['glassmorphism', 'blur', 'modern'],
      techStack: ['HTML', 'CSS'],
      description: '毛玻璃效果卡片，带有背景模糊和半透明边框。',
      demoUrl: 'https://uiverse.io/cards',
      codeSnippet: {
        language: 'html',
        source: `<div class="glass-card">
  <h3>Glass Card</h3>
  <p>Beautiful glassmorphism effect</p>
</div>

<style>
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
}
</style>`,
        dependencies: [],
      },
    },
  ],
  'animata': [
    {
      id: 'at-bouncy',
      project: 'animata',
      name: 'Bouncy Cards',
      category: 'interaction',
      style: ['spring', 'physics', 'card'],
      techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
      description: '带有弹性物理效果的卡片悬停交互，使用 Framer Motion spring。',
      demoUrl: 'https://animata.design/interaction/bouncy-cards',
      codeSnippet: {
        language: 'tsx',
        source: `import { motion } from 'framer-motion'

export default function BouncyCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="p-6 rounded-xl bg-white shadow-lg"
    >
      <h3 className="font-semibold">Bouncy Card</h3>
    </motion.div>
  )
}`,
        dependencies: ['framer-motion'],
      },
    },
    {
      id: 'at-marquee',
      project: 'animata',
      name: 'Infinite Marquee',
      category: 'text-animation',
      style: ['marquee', 'infinite', 'scroll'],
      techStack: ['React', 'Tailwind CSS'],
      description: '无限循环的跑马灯文字效果，支持水平和垂直方向。',
      demoUrl: 'https://animata.design/text/marquee',
      codeSnippet: {
        language: 'tsx',
        source: `export default function Marquee() {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-block">
        <span className="mx-4">Feature 1</span>
        <span className="mx-4">Feature 2</span>
        <span className="mx-4">Feature 3</span>
      </div>
    </div>
  )
}`,
        dependencies: [],
      },
    },
  ],
  'eldoraui': [
    {
      id: 'ed-terminal',
      project: 'eldoraui',
      name: 'Terminal Component',
      category: 'ui-component',
      style: ['terminal', 'code', 'dark'],
      techStack: ['React', 'Next.js', 'Tailwind CSS'],
      description: '仿终端风格的代码展示组件，带有光标闪烁和命令行效果。',
      demoUrl: 'https://eldoraui.site/docs/components/terminal',
      codeSnippet: {
        language: 'tsx',
        source: `import { Terminal } from 'eldoraui'

export default function App() {
  return (
    <Terminal>
      <Terminal.Line>npm install eldoraui</Terminal.Line>
      <Terminal.Line type="output">+ eldoraui@1.0.0</Terminal.Line>
    </Terminal>
  )
}`,
        dependencies: ['eldoraui'],
      },
    },
  ],
  'zelda-hyrule-ui': [
    {
      id: 'zh-healthbar',
      project: 'zelda-hyrule-ui',
      name: 'HealthBar',
      category: 'hud',
      style: ['game-ui', 'zelda', 'pixel'],
      techStack: ['React', 'Less', 'TypeScript'],
      description: '塞尔达风格的心形生命值条，支持当前值、最大值和 bonus 心。',
      demoUrl: 'https://chaos-xxl.github.io/zelda-hyrule-ui/#/docs',
      codeSnippet: {
        language: 'tsx',
        source: `import { HealthBar } from 'zelda-hyrule-ui'
import 'zelda-hyrule-ui/style'

export default function App() {
  return (
    <HealthBar current={10} max={13} bonus={3} />
  )
}`,
        dependencies: ['zelda-hyrule-ui'],
      },
    },
    {
      id: 'zh-sheikah',
      project: 'zelda-hyrule-ui',
      name: 'SheikahBackground',
      category: 'background',
      style: ['sheikah', 'glow', 'dark'],
      techStack: ['React', 'Less', 'TypeScript'],
      description: '希卡之石风格的暗色背景，带有扫描线动画效果。',
      demoUrl: 'https://chaos-xxl.github.io/zelda-hyrule-ui/#/docs',
      codeSnippet: {
        language: 'tsx',
        source: `import { SheikahBackground, SheikahScanlines } from 'zelda-hyrule-ui'
import 'zelda-hyrule-ui/style'

export default function App() {
  return (
    <SheikahBackground color="darkBlue">
      <SheikahScanlines animated opacity={0.08} />
      <h1 className="text-sheikah-blue">Compendium</h1>
    </SheikahBackground>
  )
}`,
        dependencies: ['zelda-hyrule-ui'],
      },
    },
  ],
  'pixel2motion': [
    {
      id: 'p2m-horizon',
      project: 'pixel2motion',
      name: 'Horizon Logo Motion',
      category: 'logo-animation',
      style: ['svg', 'reveal', 'minimal'],
      techStack: ['SVG', 'CSS Animation'],
      description: '品牌 Logo 水平展开动画，1900ms 时长，平滑的 SVG 路径动画。',
      demoUrl: 'https://nolangz.github.io/pixel2motion/',
      codeSnippet: {
        language: 'html',
        source: `<svg viewBox="0 0 400 120">
  <path id="logo-path" d="M20,60 L380,60" 
    stroke="#FF4D00" stroke-width="2" 
    fill="none" stroke-dasharray="400" stroke-dashoffset="400">
    <animate attributeName="stroke-dashoffset" from="400" to="0" 
      dur="1.9s" fill="freeze" />
  </path>
</svg>`,
        dependencies: [],
      },
    },
  ],
}
