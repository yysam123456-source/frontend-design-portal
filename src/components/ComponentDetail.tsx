import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, ExternalLink, Code2 } from 'lucide-react'
import ComponentPreview from './ComponentPreview'
import type { ComponentEntry, ComponentSummary, ProjectMeta } from '../types'

interface ComponentDetailProps {
  componentSummary: ComponentSummary | null
  projectMeta: ProjectMeta | undefined
  onClose: () => void
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}

export default function ComponentDetail({
  componentSummary,
  projectMeta,
  onClose,
  onCopy,
  copiedId,
}: ComponentDetailProps) {
  const [fullComponent, setFullComponent] = useState<ComponentEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const accent = projectMeta?.accentColor || '#6366F1'

  useEffect(() => {
    if (!componentSummary) {
      setFullComponent(null)
      return
    }

    setLoading(true)
    fetch(`/data/${componentSummary.project}.json`)
      .then((res) => res.json())
      .then((data: ComponentEntry[]) => {
        const found = data.find((c) => c.id === componentSummary.id)
        setFullComponent(found || null)
      })
      .catch(() => setFullComponent(null))
      .finally(() => setLoading(false))
  }, [componentSummary])

  const handleCopyCode = () => {
    if (fullComponent?.codeSnippet.source) {
      onCopy(fullComponent.codeSnippet.source, fullComponent.id)
    }
  }

  return (
    <AnimatePresence>
      {componentSummary && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-bg border-l border-border z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="text-[11px] text-ink-subtle uppercase tracking-wider font-medium">
                    {projectMeta?.name || componentSummary.project}
                  </span>
                </div>
                <h2 className="font-display font-bold text-lg text-ink truncate">
                  {componentSummary.name}
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyCode}
                  disabled={!fullComponent}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-secondary border border-border hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-40"
                >
                  {copiedId === fullComponent?.codeSnippet.source ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      复制代码
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-ink-subtle hover:text-ink hover:bg-bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Description */}
              <p className="text-sm text-ink-muted leading-relaxed">
                {componentSummary.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {componentSummary.style.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-bg-secondary text-ink-subtle border border-border"
                  >
                    {tag}
                  </span>
                ))}
                {componentSummary.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                    style={{
                      backgroundColor: `${accent}12`,
                      color: accent,
                      border: `1px solid ${accent}25`,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Preview */}
              {loading ? (
                <div className="w-full aspect-[16/10] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                    <span className="text-xs text-ink-subtle">加载组件数据...</span>
                  </div>
                </div>
              ) : (
                <ComponentPreview component={fullComponent} />
              )}

              {/* Links */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                {projectMeta && (
                  <a
                    href={projectMeta.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-ink-subtle hover:text-accent transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    查看项目仓库
                  </a>
                )}
                {projectMeta?.demoBaseUrl && (
                  <a
                    href={projectMeta.demoBaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-ink-subtle hover:text-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    官方文档
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
