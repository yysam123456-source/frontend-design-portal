import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  X,
  Code2,
  Layers,
  Sparkles,
  Layout,
  Wand2,
  Wrench,
  ArrowUpDown,
  Star,
  PlayCircle,
  Grid3X3,
  ToggleLeft,
  FileText,
  CheckSquare,
  MessageCircle,
  Maximize2,
  Loader,
} from 'lucide-react'
import Navigation from './components/Navigation'
import ComponentCard from './components/ComponentCard'
import ComponentDetail from './components/ComponentDetail'
import ComponentThumbnailPreview from './components/ComponentThumbnailPreview'
import ShowcasesPage from './components/ShowcasesPage'
import { useComponentFilter } from './hooks/useComponentFilter'
import { useCopy } from './hooks/useCopy'
import { projects } from './data/projects'
import { getPreviewRecord } from './generated/preview-manifest'
import type { ComponentSummary } from './types'

const ITEMS_PER_PAGE = 48
const OFFICIAL_DEMO_INITIAL_COUNT = 24
const OFFICIAL_DEMO_CATEGORIES = ['official-demo', 'official-showcase']
const OFFICIAL_READY_DEMO_PROJECTS = ['animata', 'uiverse', 'animejs']
const EXTRA_CATEGORIES = ['toggle-switches', 'forms', 'checkboxes', 'tooltips', 'modal', 'skeleton']
const QUICK_CATEGORY_KEYS = [
  'buttons',
  'cards',
  'text',
  'animations',
  'backgrounds',
  'inputs',
  'loaders',
  'effects',
]

type PageView = 'official' | 'components' | 'showcases'

const categoryMeta: Record<string, { label: string; icon: typeof Sparkles }> = {
  animation: { label: 'Animation', icon: Sparkles },
  'ui-library': { label: 'UI Library', icon: Layout },
  effect: { label: 'Effects', icon: Wand2 },
  tool: { label: 'Tools', icon: Wrench },
  'toggle-switches': { label: 'Toggle Switches', icon: ToggleLeft },
  forms: { label: 'Forms', icon: FileText },
  checkboxes: { label: 'Checkboxes', icon: CheckSquare },
  tooltips: { label: 'Tooltips', icon: MessageCircle },
  modal: { label: 'Modal', icon: Maximize2 },
  skeleton: { label: 'Skeleton', icon: Loader },
}

function formatCategory(category: string) {
  return categoryMeta[category]?.label || category.replace(/-/g, ' ')
}

function getDemoKindLabel(component: ComponentSummary) {
  const record = getPreviewRecord(component.id)
  if (component.category === 'official-showcase') return 'Showcase'
  if (record?.kind === 'media-video') return 'Video Demo'
  if (record?.kind === 'media-image') return 'Image Demo'
  if (record?.kind === 'html-live') return 'Live Demo'
  if (record?.kind === 'react-generated') return 'React Demo'
  if (record?.kind === 'js-demo') return 'JS Demo'
  return 'Official Demo'
}

function isOfficialWebsiteDemo(component: ComponentSummary) {
  if (OFFICIAL_DEMO_CATEGORIES.includes(component.category)) return true

  const record = getPreviewRecord(component.id)
  return (
    OFFICIAL_READY_DEMO_PROJECTS.includes(component.project) &&
    record?.status === 'ready'
  )
}

function getOfficialDemoPriority(component: ComponentSummary) {
  if (component.id === 'aj-home-modules-scroll') return -1
  if (component.category === 'official-showcase') return 0
  if (component.category === 'official-demo') return 1
  return 2
}

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
    allTags,
    allScenes,
  } = useComponentFilter()

  const { copiedId, copy } = useCopy()
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllTechStacks, setShowAllTechStacks] = useState(false)
  const [showAllStyles, setShowAllStyles] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [showAllScenes, setShowAllScenes] = useState(false)
  const [activeDemoProject, setActiveDemoProject] = useState('all')
  const [visibleDemoCount, setVisibleDemoCount] = useState(OFFICIAL_DEMO_INITIAL_COUNT)
  const [activePage, setActivePage] = useState<PageView>('official')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activePage === 'components' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePage])

  const projectMap = useMemo(() => {
    const map = new Map()
    for (const p of projects) map.set(p.id, p)
    return map
  }, [])

  const selectedComponentData = useMemo(() => {
    if (!selectedComponent) return null
    return allComponents.find((c) => c.id === selectedComponent) || null
  }, [selectedComponent, allComponents])

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

  const quickCategories = useMemo(() => {
    const seen = new Set<string>()
    return QUICK_CATEGORY_KEYS.filter((category) => allCategories.includes(category))
      .filter((category) => {
        const normalized = category.replace(/s$/, '')
        if (seen.has(normalized)) return false
        seen.add(normalized)
        return true
      })
      .slice(0, 8)
  }, [allCategories])

  const handleCloseDetail = useCallback(() => {
    setSelectedComponent(null)
  }, [])

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1)
  }, [])
  const visibleTechStacks = showAllTechStacks ? allTechStacks : allTechStacks.slice(0, 24)
  const visibleStyles = showAllStyles ? allStyles : allStyles.slice(0, 30)
  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 30)

  const stats = useMemo(() => {
    const byProject: Record<string, number> = {}
    for (const c of filteredComponents) {
      byProject[c.project] = (byProject[c.project] || 0) + 1
    }
    return byProject
  }, [filteredComponents])

  const officialDemoComponents = useMemo(() => {
    return allComponents
      .filter(isOfficialWebsiteDemo)
      .sort((a, b) => {
        const priorityDiff = getOfficialDemoPriority(a) - getOfficialDemoPriority(b)
        if (priorityDiff !== 0) return priorityDiff
        const projectDiff = a.project.localeCompare(b.project)
        if (projectDiff !== 0) return projectDiff
        if (a.category !== b.category) return a.category === 'official-showcase' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [allComponents])

  const demoTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const component of officialDemoComponents) {
      counts.set(component.project, (counts.get(component.project) || 0) + 1)
    }
    return [
      { id: 'all', label: 'All', count: officialDemoComponents.length },
      ...Array.from(counts.entries()).map(([projectId, count]) => ({
        id: projectId,
        label: projectMap.get(projectId)?.name || projectId,
        count,
      })),
    ]
  }, [officialDemoComponents, projectMap])

  const activeOfficialDemos = useMemo(() => {
    if (activeDemoProject === 'all') return officialDemoComponents
    return officialDemoComponents.filter((component) => component.project === activeDemoProject)
  }, [activeDemoProject, officialDemoComponents])

  const visibleOfficialDemos = activeOfficialDemos.slice(0, visibleDemoCount)

  useEffect(() => {
    setVisibleDemoCount(OFFICIAL_DEMO_INITIAL_COUNT)
  }, [activeDemoProject])

  const activeFilterCount =
    filters.projects.length + filters.techStack.length + filters.style.length + filters.category.length + filters.tags.length + filters.scene.length

  const filterPanel = (
    <div className="rounded-2xl bg-bg-secondary/80 border border-border p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Filters</h2>
          <p className="text-[11px] text-ink-subtle mt-0.5">Refine by source, stack, style, and category.</p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              clearFilters()
              setPage(1)
            }}
            className="text-[11px] text-accent hover:text-accent-light transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
          Source
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

      {allTechStacks.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
            Tech Stack
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
                +{allTechStacks.length - visibleTechStacks.length} more
              </button>
            )}
            {showAllTechStacks && allTechStacks.length > 24 && (
              <button
                onClick={() => setShowAllTechStacks(false)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {allStyles.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
            Style
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
                +{allStyles.length - visibleStyles.length} more
              </button>
            )}
            {showAllStyles && allStyles.length > 30 && (
              <button
                onClick={() => setShowAllStyles(false)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {allCategories.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
            Category
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
                {formatCategory(c)}
              </button>
            ))}
            {allCategories.length > visibleCategories.length && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                +{allCategories.length - visibleCategories.length} more
              </button>
            )}
            {showAllCategories && allCategories.length > 30 && (
              <button
                onClick={() => setShowAllCategories(false)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
            Function
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(showAllTags ? allTags : allTags.slice(0, 20)).map((t) => (
              <button
                key={t}
                onClick={() => {
                  toggleArrayFilter('tags', t)
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors capitalize ${
                  filters.tags.includes(t)
                    ? 'border-accent/50 text-accent bg-accent/5'
                    : 'border-border text-ink-subtle hover:text-ink bg-bg'
                }`}
              >
                {t.replace(/-/g, ' ')}
              </button>
            ))}
            {allTags.length > 20 && !showAllTags && (
              <button
                onClick={() => setShowAllTags(true)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                +{allTags.length - 20} more
              </button>
            )}
            {showAllTags && allTags.length > 20 && (
              <button
                onClick={() => setShowAllTags(false)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {allScenes.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-2 block">
            Scene
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(showAllScenes ? allScenes : allScenes.slice(0, 12)).map((s) => (
              <button
                key={s}
                onClick={() => {
                  toggleArrayFilter('scene', s)
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors capitalize ${
                  filters.scene.includes(s)
                    ? 'border-accent/50 text-accent bg-accent/5'
                    : 'border-border text-ink-subtle hover:text-ink bg-bg'
                }`}
              >
                {s.replace(/-/g, ' ')}
              </button>
            ))}
            {allScenes.length > 12 && !showAllScenes && (
              <button
                onClick={() => setShowAllScenes(true)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-border text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                +{allScenes.length - 12} more
              </button>
            )}
            {showAllScenes && allScenes.length > 12 && (
              <button
                onClick={() => setShowAllScenes(false)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-border text-ink-subtle hover:text-ink bg-bg transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-bg">
      {activePage !== 'showcases' && (
        <Navigation
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {activePage === 'showcases' && (
        <ShowcasesPage
          onNavigate={(page) => {
            setActivePage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {activePage !== 'showcases' && (
      <div className="relative w-full overflow-hidden border-b border-border-light bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.12),transparent_34%),linear-gradient(180deg,#fff,#fafafa)] px-6 lg:px-12 pt-24 pb-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(10,10,10,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,10,0.03)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-accent/10 shadow-sm">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink">
                {activePage === 'official'
                  ? 'Official Demo Gallery'
                  : 'Frontend Component Gallery'}
              </h1>
              <p className="text-sm text-ink-muted mt-2 max-w-2xl">
                {activePage === 'official'
                  ? `Browse ${officialDemoComponents.length.toLocaleString()} curated demos from official project websites without component filters getting in the way.`
                  : `Explore ${allComponents.length.toLocaleString()} open-source UI components with live previews, cross-project filters, and fast discovery.`}
              </p>
            </div>
          </div>

          {activePage === 'components' && (
            <>
              <div className="relative mt-8 max-w-3xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    updateFilter('search', e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by name, style, tech stack..."
                  className="w-full pl-12 pr-24 py-4 rounded-2xl bg-bg border border-border text-base text-ink placeholder:text-ink-subtle shadow-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                />
                <span className="hidden sm:block absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-bg-secondary px-2 py-1 text-[10px] font-medium text-ink-subtle">
                  Ctrl K
                </span>
                {filters.search && (
                  <button
                    onClick={() => {
                      updateFilter('search', '')
                      setPage(1)
                    }}
                    className="absolute right-16 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {quickCategories.map((category) => {
                  const Icon = categoryMeta[category]?.icon || Sparkles
                  const active = filters.category.includes(category)
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        toggleArrayFilter('category', category)
                        setPage(1)
                      }}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg/80 text-ink-muted hover:border-accent/30 hover:text-accent'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {formatCategory(category)}
                    </button>
                  )
                })}
                {EXTRA_CATEGORIES.map((category) => {
                  const Icon = categoryMeta[category]?.icon || Sparkles
                  const active = filters.category.includes(category)
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        toggleArrayFilter('category', category)
                        setPage(1)
                      }}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg/80 text-ink-muted hover:border-accent/30 hover:text-accent'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {formatCategory(category)}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {activePage === 'official' && officialDemoComponents.length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-bg/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    Official Demos
                  </div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    Heavy project showcases
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-ink-subtle">
                    Curated heavy demos from official project websites, grouped by source for faster browsing.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActivePage('components')
                    updateFilter('search', '')
                    updateFilter(
                      'category',
                      activeDemoProject === 'all' || OFFICIAL_READY_DEMO_PROJECTS.includes(activeDemoProject)
                        ? []
                        : OFFICIAL_DEMO_CATEGORIES
                    )
                    updateFilter('projects', activeDemoProject === 'all' ? [] : [activeDemoProject])
                    setPage(1)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/60 hover:bg-accent/15"
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  View all in components
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {demoTabs.map((tab) => {
                  const active = activeDemoProject === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDemoProject(tab.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg-secondary text-ink-subtle hover:border-accent/30 hover:text-accent'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-1 text-ink-subtle/70">{tab.count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visibleOfficialDemos.map((component) => {
                  const meta = projectMap.get(component.project)
                  return (
                    <button
                      key={component.id}
                      onClick={() => setSelectedComponent(component.id)}
                      className="group overflow-hidden rounded-2xl border border-border bg-bg-secondary text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                    >
                      <div className="relative aspect-video overflow-hidden border-b border-border bg-bg">
                        <ComponentThumbnailPreview component={component} projectMeta={meta} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-bg/90 px-2 py-1 text-[10px] font-semibold text-ink shadow-sm backdrop-blur">
                          <PlayCircle className="h-3 w-3 text-accent" />
                          {getDemoKindLabel(component)}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: meta?.accentColor || '#6366F1' }}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                            {meta?.name || component.project}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
                          {component.name}
                        </h3>
                        <p className="mt-2 truncate text-[11px] capitalize text-ink-subtle">
                          {formatCategory(component.category)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {activeOfficialDemos.length > OFFICIAL_DEMO_INITIAL_COUNT && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-xs text-ink-subtle">
                    Showing <span className="font-medium text-ink">{visibleOfficialDemos.length}</span> of{' '}
                    <span className="font-medium text-ink">{activeOfficialDemos.length}</span> demos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visibleOfficialDemos.length < activeOfficialDemos.length && (
                      <button
                        onClick={() =>
                          setVisibleDemoCount((count) =>
                            Math.min(count + 24, activeOfficialDemos.length)
                          )
                        }
                        className="rounded-xl border border-border bg-bg px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        Show more demos
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActivePage('components')
                        updateFilter('search', '')
                        updateFilter('category', OFFICIAL_DEMO_CATEGORIES)
                        updateFilter('projects', activeDemoProject === 'all' ? [] : [activeDemoProject])
                        setPage(1)
                      }}
                      className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/60 hover:bg-accent/15"
                    >
                      View all in components
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activePage === 'components' && (
            <>
              <div className="flex items-center gap-3 mt-6 xl:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'border-accent/50 text-accent bg-accent/5'
                      : 'border-border text-ink-subtle hover:text-ink bg-bg-secondary'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px]">
                      {activeFilterCount}
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
                    Clear all
                  </button>
                )}

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
                  {filters.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        toggleArrayFilter('tags', t)
                        setPage(1)
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    >
                      {t.replace(/-/g, ' ')}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  {filters.scene.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        toggleArrayFilter('scene', s)
                        setPage(1)
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    >
                      {s.replace(/-/g, ' ')}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>

              {showFilters && <div className="mt-4 xl:hidden">{filterPanel}</div>}
            </>
          )}
        </div>
      </div>
      )}

      {activePage === 'components' && (
      <main className="w-full px-6 lg:px-12 pb-16">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden xl:block pt-8">
            <div className="sticky top-20">{filterPanel}</div>
          </aside>

          <section id="gallery-results" className="scroll-mt-24 pt-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-ink-subtle">Loading components...</p>
              </div>
            ) : filteredComponents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-dashed border-border bg-bg-secondary/60">
                <Code2 className="w-8 h-8 text-ink-subtle/40" />
                <p className="text-sm font-medium text-ink-muted">No components found</p>
                <p className="text-xs text-ink-subtle">Try a broader keyword or remove one filter.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXTRA_CATEGORIES.slice(0, 5).map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        toggleArrayFilter('category', category)
                        setPage(1)
                      }}
                      className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-ink-subtle hover:text-accent"
                    >
                      {formatCategory(category)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    clearFilters()
                    setPage(1)
                  }}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <p className="text-xs text-ink-subtle">
                      <span className="text-ink font-medium">{filteredComponents.length.toLocaleString()}</span>{' '}
                      components
                      {activeFilterCount > 0 && ' filtered'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[...filters.projects, ...filters.techStack, ...filters.style, ...filters.category, ...filters.tags, ...filters.scene].map((value) => (
                        <span
                          key={value}
                          className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[10px] text-accent"
                        >
                          {formatCategory(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <label className="flex w-full items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs text-ink-subtle sm:w-auto">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort
                    <select
                      value={filters.sort}
                      onChange={(event) => {
                        updateFilter('sort', event.target.value as typeof filters.sort)
                        setPage(1)
                      }}
                      className="bg-transparent text-ink focus:outline-none"
                    >
                      <option value="preview">Preview first</option>
                      <option value="name">Name A-Z</option>
                      <option value="project">Project</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
                      Load more ({(filteredComponents.length - paginatedComponents.length).toLocaleString()})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      )}

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
            Frontend Design Gallery — {allComponents.length.toLocaleString()} open-source components
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
