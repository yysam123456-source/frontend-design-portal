import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { FilterState } from '../types'

interface FilterBarProps {
  filters: FilterState
  techStacks: string[]
  categories: string[]
  onToggleTech: (value: string) => void
  onToggleCategory: (value: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const categoryLabels: Record<string, string> = {
  animation: '动画',
  'ui-library': 'UI 库',
  effect: '特效',
  tool: '工具',
}

export default function FilterBar({
  filters,
  techStacks,
  categories,
  onToggleTech,
  onToggleCategory,
  onClear,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="sticky top-14 z-40 bg-white/80 backdrop-blur-sm border-b border-border px-6 lg:px-12 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-subtle mr-1">筛选</span>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onToggleCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.category.includes(cat)
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-ink-muted hover:text-ink hover:bg-border-light'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        {techStacks.slice(0, 6).map((tech) => (
          <button
            key={tech}
            onClick={() => onToggleTech(tech)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.techStack.includes(tech)
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-ink-muted hover:text-ink hover:bg-border-light'
            }`}
          >
            {tech}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1 text-xs text-ink-subtle hover:text-accent transition-colors"
          >
            <X className="w-3 h-3" />
            清除筛选
          </button>
        )}
      </div>
    </motion.div>
  )
}
