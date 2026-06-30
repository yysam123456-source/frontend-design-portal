import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, ExternalLink, Copy, Check, Maximize2 } from 'lucide-react'
import type { ComponentSummary, ProjectMeta } from '../types'

interface ComponentCardProps {
  component: ComponentSummary
  projectMeta: ProjectMeta | undefined
  isSelected: boolean
  onSelect: () => void
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}

export default function ComponentCard({
  component,
  projectMeta,
  isSelected,
  onSelect,
  onCopy,
  copiedId,
}: ComponentCardProps) {
  const [showCode, setShowCode] = useState(false)
  const accent = projectMeta?.accentColor || '#6366F1'

  const handleCopy = async () => {
    onCopy(component.id, component.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
          : 'border-border bg-bg hover:border-ink-subtle/30 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: accent }}
              />
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-medium truncate">
                {projectMeta?.name || component.project}
              </span>
            </div>
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-accent transition-colors truncate">
              {component.name}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            className="flex-shrink-0 p-1.5 rounded-md text-ink-subtle hover:text-accent hover:bg-accent/10 transition-colors"
            title="复制组件ID"
          >
            {copiedId === component.id ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-[11px] text-ink-muted mt-1.5 line-clamp-2 leading-relaxed">
          {component.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {component.style.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] bg-bg-secondary text-ink-subtle border border-border"
            >
              {tag}
            </span>
          ))}
          {component.techStack.slice(0, 2).map((tech) => (
            <span
              key={tech}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${accent}15`,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Preview thumbnail area */}
      <div className="px-4 pb-4">
        <div className="relative rounded-lg bg-bg-secondary border border-border aspect-[16/10] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Code2 className="w-6 h-6 text-ink-subtle/40 mx-auto mb-1.5" />
              <span className="text-[10px] text-ink-subtle/60 font-mono">
                {component.language}
              </span>
            </div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg/90 text-xs text-accent font-medium">
              <Maximize2 className="w-3 h-3" />
              点击预览
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-ink-subtle capitalize">
            {component.category}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCode(!showCode)
              }}
              className="text-[10px] text-ink-subtle hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/5"
            >
              {showCode ? '收起' : '源码'}
            </button>
            {projectMeta && (
              <a
                href={projectMeta.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-ink-subtle hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/5 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
