import Navigation from './components/Navigation'
import Hero from './components/Hero'
import FilterBar from './components/FilterBar'
import ProjectSection from './components/ProjectSection'
import { useFilter } from './hooks/useFilter'
import { useCopy } from './hooks/useCopy'
import { projects, allTechStacks, allCategories } from './data/projects'
import { componentData } from './data/components'

export default function App() {
  const { filters, updateFilter, toggleArrayFilter, clearFilters, filteredProjects, hasActiveFilters } =
    useFilter(projects)
  const { copiedId, copy } = useCopy()

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <Hero
        search={filters.search}
        onSearchChange={(v) => updateFilter('search', v)}
        totalProjects={projects.length}
      />
      <FilterBar
        filters={filters}
        techStacks={allTechStacks}
        categories={allCategories}
        onToggleTech={(v) => toggleArrayFilter('techStack', v)}
        onToggleCategory={(v) => toggleArrayFilter('category', v)}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <main>
        {filteredProjects.length === 0 ? (
          <div className="px-6 lg:px-12 py-24 text-center">
            <p className="text-sm text-ink-muted">未找到匹配的项目，请尝试其他筛选条件</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-accent hover:text-accent-light transition-colors"
            >
              清除筛选
            </button>
          </div>
        ) : (
          filteredProjects.map((project, index) => (
            <ProjectSection
              key={project.id}
              project={project}
              components={componentData[project.id] || []}
              copiedId={copiedId}
              onCopy={copy}
              index={index}
            />
          ))
        )}
      </main>

      <footer className="w-full px-6 lg:px-12 py-12 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-subtle">
            Frontend Design Gallery — 聚合 {projects.length} 个开源前端设计项目
          </p>
          <a
            href="https://github.com/yysam123456-source/frontend-design-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-subtle hover:text-accent transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
