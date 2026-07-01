import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, Code2, Layers } from 'lucide-react'
import Navigation from './components/Navigation'
import ComponentCard from './components/ComponentCard'
import ComponentDetail from './components/ComponentDetail'
import { useComponentFilter } from './hooks/useComponentFilter'
import { useCopy } from './hooks/useCopy'
import { projects } from './data/projects'

const ITEMS_PER_PAGE = 48

export default function App() {
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    filteredComponents,
    hasActiveFilters,
    allComponents,
    isLoading,
  } = useComponentFilter()

  const { copiedId, copy } = useCopy()
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllTechStacks, setShowAllTechStacks] = useState(false)
  const [showAllStyles, setShowAllStyles] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const projectMap = useMemo(() => {
    const map = new Map()
    for (const p of projects) map.set(p.id, p)
    return map
  }, [])

  const selectedComponentData = useMemo(() => {
    if (!selectedComponent) return null
    return filteredComponents.find((c) => c.id === selectedComponent) || null
  }, [selectedComponent, filteredComponents])

  const selectedProjectMeta = useMemo(() => {
    if (!selectedComponentData) return undefined
    return projectMap.get(selectedComponentData.project)
  }, [selectedComponentData, projectMap])

  const paginatedComponents = useMemo(() => {
    return filteredComponents.slice(0, page * ITEMS_PER_PAGE)
  }, [filteredComponents, page])

  const hasMore = paginatedComponents.length < filteredComponents.length

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedComponent(id)
    },
    []
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedComponent(null)
  }, [])

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1)
  }, [])

  // 收集所有可选的筛选值
  const allProjects = useMemo(() => projects.map((p) => p.id), [])
  const allTechStacks = useMemo(
    () => Array.from(new Set(allComponents.flatMap((c) => c.techStack))).sort(),
    [allComponents]
  )
  const allStyles = useMemo(
    () => Array.from(new Set(allComponents.flatMap((c) => c.style))).sort(),
    [allComponents]
  )
  const allCategories = useMemo(
    () => Array.from(new Set(allComponents.map((c) => c.category))).sort(),
    [allComponents]
  )
  const visibleTechStacks = showAllTechStacks ? allTechStacks : allTechStacks.slice(0, 24)
  const visibleStyles = showAllStyles ? allStyles : allStyles.slice(0, 30)
  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 30)

  // 统计
  const stats = useMemo(() => {
    const byProject: Record<string, number> = {}
    for (const c of filteredComponents) {
      byProject[c.project] = (byProject[c.project] || 0) + 1
    }
    return byProject
  }, [filteredComponents])

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />

      {/* Hero */}
      <div className="w-full px-6 lg:px-12 pt-12 pb-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                前端组件库
              </h1>
              <p className="text-xs text-ink-subtle mt-0.5">
                聚合 {allComponents.length} 个开源组件，跨项目筛选与预览
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                updateFilter('search', e.target.value)
                setPage(1)
              }}
              placeholder="搜索组件名称、风格、技术栈..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-secondary border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => {
                  updateFilter('search', '')
                  setPage(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-accent/50 text-accent bg-accent/5'
                  : 'border-border text-ink-subtle hover:text-ink bg-bg-secondary'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              筛选
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px]">
                  {filters.projects.length +
                    filters.techStack.length +
                    filters.style.length +
                    filters.category.length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters()
                  setPage(1)
                }}
                className="text-xs text-ink-subtle hover:text-accent transition-colors"
              >
                清除全部
              </button>
            )}

            {/* Active filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {filters.projects.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    toggleArrayFilter('projects', p)
                    setPage(1)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-accent/10 text-accent border border-accent/20"
                >
                  {projectMap.get(p)?.name || p}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {filters.techStack.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    toggleArrayFilter('techStack', t)
                    setPage(1)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-bg-secondary text-ink-subtle border border-border"
                >
                  {t}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {filters.style.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    toggleArrayFilter('style', s)
                    setPage(1)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-bg-secondary text-ink-subtle border border-border"
                >
                  {s}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-xl bg-bg-secondary border border-border space-y-4">
              {/* Projects */}
              <div>
                <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
                  项目来源
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allProjects.map((p) => {
                    const proj = projectMap.get(p)
                    const active = filters.projects.includes(p)
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          toggleArrayFilter('projects', p)
                          setPage(1)
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                          active
                            ? 'border-accent/50 text-accent bg-accent/5'
                            : 'border-border text-ink-subtle hover:text-ink bg-bg'
                        }`}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                          style={{ backgroundColor: proj?.accentColor || '#6366F1' }}
                        />
                        {proj?.name || p}
                        <span className="ml-1 text-ink-subtle/60">({stats[p] || 0})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tech Stack */}
              {allTechStacks.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
                    技术栈
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleTechStacks.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          toggleArrayFilter('techStack', t)
                          setPage(1)
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                          filters.techStack.includes(t)
                            ? 'border-accent/50 text-accent bg-accent/5'
                            : 'border-border text-ink-subtle hover:text-ink bg-bg'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    {allTechStacks.length > visibleTechStacks.length && (
                      <button
                        onClick={() => setShowAllTechStacks(true)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
                      >
                        +{allTechStacks.length - visibleTechStacks.length} 更多
                      </button>
                    )}
                    {showAllTechStacks && allTechStacks.length > 24 && (
                      <button
                        onClick={() => setShowAllTechStacks(false)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
                      >
                        收起
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Style */}
              {allStyles.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
                    风格
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleStyles.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          toggleArrayFilter('style', s)
                          setPage(1)
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                          filters.style.includes(s)
                            ? 'border-accent/50 text-accent bg-accent/5'
                            : 'border-border text-ink-subtle hover:text-ink bg-bg'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {allStyles.length > visibleStyles.length && (
                      <button
                        onClick={() => setShowAllStyles(true)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
                      >
                        +{allStyles.length - visibleStyles.length} 更多
                      </button>
                    )}
                    {showAllStyles && allStyles.length > 30 && (
                      <button
                        onClick={() => setShowAllStyles(false)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
                      >
                        收起
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Category */}
              {allCategories.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
                    分类
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleCategories.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          toggleArrayFilter('category', c)
                          setPage(1)
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors capitalize ${
                          filters.category.includes(c)
                            ? 'border-accent/50 text-accent bg-accent/5'
                            : 'border-border text-ink-subtle hover:text-ink bg-bg'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    {allCategories.length > visibleCategories.length && (
                      <button
                        onClick={() => setShowAllCategories(true)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
                      >
                        +{allCategories.length - visibleCategories.length} 更多
                      </button>
                    )}
                    {showAllCategories && allCategories.length > 30 && (
                      <button
                        onClick={() => setShowAllCategories(false)}
                        className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
                      >
                        收起
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Component Grid */}
      <main className="w-full px-6 lg:px-12 pb-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-ink-subtle">加载组件数据中...</p>
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Code2 className="w-8 h-8 text-ink-subtle/40" />
            <p className="text-sm text-ink-muted">未找到匹配的组件</p>
            <button
              onClick={() => {
                clearFilters()
                setPage(1)
              }}
              className="text-xs text-accent hover:text-accent-light transition-colors"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-ink-subtle">
                共 <span className="text-ink font-medium">{filteredComponents.length}</span> 个组件
                {hasActiveFilters && '（已筛选）'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    projectMeta={projectMap.get(component.project)}
                    isSelected={selectedComponent === component.id}
                    onSelect={() => handleSelect(component.id)}
                    onCopy={copy}
                    copiedId={copiedId}
                  />
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 rounded-lg text-xs font-medium bg-bg-secondary border border-border text-ink hover:border-accent/50 hover:text-accent transition-colors"
                >
                  加载更多 ({filteredComponents.length - paginatedComponents.length} 个)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Component Detail Drawer */}
      <ComponentDetail
        componentSummary={selectedComponentData}
        projectMeta={selectedProjectMeta}
        onClose={handleCloseDetail}
        onCopy={copy}
        copiedId={copiedId}
      />

      <footer className="w-full px-6 lg:px-12 py-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-subtle">
            Frontend Design Gallery — 聚合 {allComponents.length} 个开源组件
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
