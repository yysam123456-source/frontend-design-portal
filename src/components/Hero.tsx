import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface HeroProps {
  search: string
  onSearchChange: (value: string) => void
  totalProjects: number
}

export default function Hero({ search, onSearchChange, totalProjects }: HeroProps) {
  return (
    <section className="relative w-full min-h-[70vh] flex flex-col justify-center px-6 lg:px-12 pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #0A0A0A 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="font-mono text-xs text-accent mb-4 tracking-widest uppercase">
            Open Source Collection
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] mb-6">
            Frontend Design
            <br />
            <span className="text-ink-muted">Gallery</span>
          </h1>
          <p className="text-base text-ink-muted max-w-lg leading-relaxed mb-10">
            聚合 {totalProjects} 个优质前端设计开源项目 — 动画引擎、UI 组件库、交互效果、游戏主题 UI，
            一键预览效果，复制代码即用。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索项目、组件、效果..."
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border rounded-lg text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </motion.div>
      </div>
    </section>
  )
}
