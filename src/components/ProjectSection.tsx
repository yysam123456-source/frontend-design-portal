import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import ProjectPreview from './ProjectPreview'
import CodeDrawer from './CodeDrawer'
import type { ProjectMeta, ComponentEntry } from '../types'

interface ProjectSectionProps {
  project: ProjectMeta
  components: ComponentEntry[]
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  index: number
}

export default function ProjectSection({
  project,
  components,
  copiedId,
  onCopy,
  index,
}: ProjectSectionProps) {
  const [expanded, setExpanded] = useState(index < 3)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full px-6 lg:px-12 py-16 border-b border-border last:border-b-0"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: project.accentColor }}
            />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              {project.name}
            </h2>
          </div>
          <p className="text-sm text-ink-muted max-w-xl leading-relaxed">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-secondary text-ink-muted border border-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <Code2 className="w-4 h-4" />
            GitHub
          </a>
          <a
            href={project.demoBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            官方站点
          </a>
        </div>
      </div>

      {/* Live Preview — Project Level */}
      <div className="mb-8">
        <ProjectPreview project={project} />
      </div>

      {/* Components List */}
      {components.length > 0 && (
        <>
          <div className={`space-y-0 ${!expanded ? 'max-h-0 overflow-hidden' : ''}`}>
            {components.map((component) => (
              <div
                key={component.id}
                className="py-5 border-b border-border-light last:border-b-0 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-base text-ink group-hover:text-accent transition-colors">
                      {component.name}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      {component.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {component.style.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] text-ink-subtle"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <CodeDrawer
                      component={component}
                      copiedId={copiedId}
                      onCopy={onCopy}
                    />
                  </div>
                  {component.demoUrl && (
                    <div className="w-full sm:w-64 flex-shrink-0">
                      <a
                        href={component.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-ink-subtle hover:text-accent transition-colors mb-1"
                      >
                        查看独立演示 →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {components.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex items-center gap-1.5 text-xs text-ink-subtle hover:text-accent transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  收起组件列表
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  展开 {components.length} 个组件
                </>
              )}
            </button>
          )}
        </>
      )}
    </motion.section>
  )
}
