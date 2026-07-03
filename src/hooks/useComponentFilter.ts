import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ComponentSummary, FilterState } from '../types'
import { getPreviewRecord } from '../generated/preview-manifest'

interface UseComponentFilterResult {
  filters: FilterState
  updateFilter: (key: keyof FilterState, value: string | string[]) => void
  toggleArrayFilter: (key: 'projects' | 'techStack' | 'style' | 'category' | 'tags' | 'scene', value: string) => void
  clearFilters: () => void
  filteredComponents: ComponentSummary[]
  hasActiveFilters: boolean
  allComponents: ComponentSummary[]
  isLoading: boolean
  allTags: string[]
  allScenes: string[]
}

// ── Tag inference: derive fine-grained functional categories from name + category ──
const TAG_RULES: { keywords: string[]; tag: string }[] = [
  { keywords: ['text', 'typography', 'letter', 'glitch', 'scramble', 'fade', 'decrypt', 'blur text', 'ascii', 'circular text', 'falling text', 'gradient text', 'type', 'word', 'character', 'line'], tag: 'text-effects' },
  { keywords: ['button', 'cta', 'shiny', 'live button', 'click'], tag: 'buttons' },
  { keywords: ['card', 'profile card', 'decay card', 'reflective card', 'pixel card', 'swap', 'bounce cards'], tag: 'cards' },
  { keywords: ['menu', 'nav', 'dock', 'pill', 'folder', 'bubble menu', 'infinite menu', 'flowing menu', 'gooey nav', 'card nav'], tag: 'navigation' },
  { keywords: ['input', 'form', 'otp', 'field', 'search'], tag: 'forms' },
  { keywords: ['loader', 'spinner', 'skeleton', 'progress', 'loading'], tag: 'loaders' },
  { keywords: ['modal', 'dialog', 'drawer', 'popup'], tag: 'overlays' },
  { keywords: ['grid', 'list', 'masonry', 'gallery', 'carousel', 'orbit images', 'circular gallery', 'dome gallery', 'shape grid'], tag: 'layouts' },
  { keywords: ['background', 'gradient', 'aurora', 'noise', 'pattern', 'grid motion', 'grid scan', 'hyperspeed', 'galaxy'], tag: 'backgrounds' },
  { keywords: ['hover', 'glow', 'shine', 'glare', 'reflection', 'magnet', 'border glow', 'electric border'], tag: 'hover-effects' },
  { keywords: ['scroll', 'reveal', 'float', 'stack', 'scroll float', 'scroll reveal', 'scroll stack', 'scroll velocity', 'infinite scroll'], tag: 'scroll-effects' },
  { keywords: ['image', 'picture', 'photo', 'trail', 'image trail', 'lanyard', 'model viewer'], tag: 'image-effects' },
  { keywords: ['chart', 'graph', 'data', 'radar', 'counter', 'count up'], tag: 'data-display' },
  { keywords: ['tooltip', 'popover'], tag: 'tooltips' },
  { keywords: ['badge', 'tag', 'pill', 'animated badge'], tag: 'badges' },
  { keywords: ['tab', 'accordion', 'stepper', 'shift tabs'], tag: 'content-switchers' },
  { keywords: ['particle', 'snow', 'rain', 'fire', 'spark', 'pixel snow', 'pixel blast', 'pixel trail'], tag: 'particles' },
  { keywords: ['cursor', 'mouse', 'pointer', 'blob cursor', 'ghost cursor', 'crosshair', 'click spark'], tag: 'cursor-effects' },
  { keywords: ['video', 'media', 'player'], tag: 'media' },
  { keywords: ['table'], tag: 'tables' },
  { keywords: ['toggle', 'switch', 'checkbox', 'radio'], tag: 'toggles' },
  { keywords: ['slider', 'range', 'elastic slider'], tag: 'sliders' },
  { keywords: ['clock', 'timer', 'counter', 'count', 'count up'], tag: 'counters' },
  { keywords: ['social', 'share', 'icon', 'glass icons'], tag: 'icons' },
  { keywords: ['footer', 'header', 'hero'], tag: 'sections' },
  { keywords: ['bento'], tag: 'bento-grids' },
  { keywords: ['calendar', 'date', 'picker'], tag: 'calendars' },
  { keywords: ['map', 'location', 'globe', 'cobe'], tag: 'maps' },
  { keywords: ['terminal', 'code', 'snippet', 'faulty terminal'], tag: 'terminals' },
  { keywords: ['globe', 'world', 'sphere', 'cobe', 'orb', 'planet'], tag: 'globes' },
  { keywords: ['orbit', 'rotation', 'loop', 'logo loop'], tag: 'orbits' },
]

// ── Scene inference: derive usage scenarios from name + category ──
const SCENE_RULES: { keywords: string[]; scene: string }[] = [
  { keywords: ['hero', 'landing', 'cta', 'showcase', 'feature', 'banner', 'intro'], scene: 'landing-page' },
  { keywords: ['chart', 'data', 'stat', 'dashboard', 'widget', 'table', 'radar', 'counter'], scene: 'dashboard' },
  { keywords: ['input', 'form', 'otp', 'field', 'search', 'wizard', 'validation'], scene: 'form' },
  { keywords: ['menu', 'nav', 'breadcrumb', 'pagination', 'sidebar', 'dock', 'folder'], scene: 'navigation' },
  { keywords: ['card', 'grid', 'list', 'gallery', 'masonry', 'bento', 'content'], scene: 'content-display' },
  { keywords: ['text', 'typography', 'heading', 'paragraph', 'font'], scene: 'text-display' },
  { keywords: ['login', 'signup', 'auth', 'otp', 'password', 'clerk'], scene: 'authentication' },
  { keywords: ['product', 'cart', 'checkout', 'pricing', 'shop', 'ecommerce'], scene: 'e-commerce' },
  { keywords: ['testimonial', 'logo', 'timeline', 'brand', 'social proof'], scene: 'marketing' },
  { keywords: ['loader', 'skeleton', 'spinner', 'progress', 'loading'], scene: 'loading' },
  { keywords: ['toast', 'notification', 'alert', 'modal', 'tooltip', 'popover', 'dialog'], scene: 'feedback' },
  { keywords: ['share', 'comment', 'profile', 'avatar', 'social'], scene: 'social' },
  { keywords: ['video', 'audio', 'image gallery', 'carousel', 'media'], scene: 'media' },
  { keywords: ['background', 'gradient', 'pattern', 'particles', 'noise', 'aurora'], scene: 'background' },
  { keywords: ['hover', 'click', 'drag', 'scroll', 'cursor', 'mouse', 'interactive'], scene: 'interactive' },
]

function inferTags(component: ComponentSummary): string[] {
  const name = component.name.toLowerCase()
  const category = component.category.toLowerCase()
  const text = `${name} ${category}`
  const tags = new Set<string>()

  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      tags.add(rule.tag)
    }
  }

  // Project-specific category mappings
  if (component.project === 'react-bits') {
    if (category === 'animations') tags.add('animations')
    if (category === 'backgrounds') tags.add('backgrounds')
    if (category === 'components') tags.add('ui-components')
  }
  if (component.project === 'animata') {
    if (category === 'button') tags.add('buttons')
    if (category === 'card') tags.add('cards')
    if (category === 'background') tags.add('backgrounds')
    if (category === 'accordion') tags.add('content-switchers')
    if (category === 'bento-grid') tags.add('bento-grids')
    if (category === 'text') tags.add('text-effects')
  }
  if (component.project === 'uiverse') {
    if (category === 'buttons') tags.add('buttons')
    if (category === 'cards') tags.add('cards')
    if (category === 'inputs') tags.add('forms')
    if (category === 'loaders') tags.add('loaders')
    if (category === 'dropdowns') tags.add('navigation')
    if (category === 'checkboxes') tags.add('toggles')
  }
  if (component.project === 'eldoraui') {
    if (category === 'component') tags.add('ui-components')
    if (category === 'example') tags.add('showcase')
  }

  return Array.from(tags)
}

function inferScene(component: ComponentSummary): string[] {
  const name = component.name.toLowerCase()
  const category = component.category.toLowerCase()
  const text = `${name} ${category}`
  const scenes = new Set<string>()

  for (const rule of SCENE_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      scenes.add(rule.scene)
    }
  }

  // Fallback: derive from tags
  const tags = component.tags || []
  if (tags.includes('buttons') || tags.includes('cards') || tags.includes('layouts')) {
    scenes.add('content-display')
  }
  if (tags.includes('text-effects')) {
    scenes.add('text-display')
  }
  if (tags.includes('backgrounds') || tags.includes('particles')) {
    scenes.add('background')
  }
  if (tags.includes('loaders')) {
    scenes.add('loading')
  }
  if (tags.includes('navigation')) {
    scenes.add('navigation')
  }
  if (tags.includes('overlays') || tags.includes('tooltips')) {
    scenes.add('feedback')
  }

  // Official demos always get showcase scene
  if (category === 'official-demo' || category === 'official-showcase') {
    scenes.add('showcase')
  }

  return Array.from(scenes)
}

function enrichComponents(components: ComponentSummary[]): ComponentSummary[] {
  return components.map((c) => {
    const tags = inferTags(c)
    const scene = inferScene({ ...c, tags })
    return { ...c, tags, scene }
  })
}

export function useComponentFilter(): UseComponentFilterResult {
  const [rawComponents, setRawComponents] = useState<ComponentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projects: [],
    techStack: [],
    style: [],
    category: [],
    tags: [],
    scene: [],
    sort: 'preview',
  })

  useEffect(() => {
    fetch('/data/index.json')
      .then((res) => res.json())
      .then((data) => {
        setRawComponents(enrichComponents(data.components || []))
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const allComponents = rawComponents

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const toggleArrayFilter = useCallback(
    (key: 'projects' | 'techStack' | 'style' | 'category' | 'tags' | 'scene', value: string) => {
      setFilters((prev) => {
        const current = prev[key]
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
        return { ...prev, [key]: next }
      })
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({ search: '', projects: [], techStack: [], style: [], category: [], tags: [], scene: [], sort: 'preview' })
  }, [])

  const filteredComponents = useMemo(() => {
    const previewPriority = (component: ComponentSummary) => {
      const record = getPreviewRecord(component.id)
      if (record?.status !== 'ready') return 3
      if (record.kind === 'react-generated') return 0
      if (record.kind === 'html-live') return 1
      if (record.kind === 'media-video') return 2
      if (record.kind === 'media-image') return 3
      if (record.kind === 'js-demo') return 4
      return 5
    }

    const searchTerms = filters.search
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean)

    return allComponents.filter((component) => {
      const searchableText = [
        component.name,
        component.description,
        component.project,
        component.category,
        ...(component.tags || []),
        ...(component.scene || []),
        ...component.style,
        ...component.techStack,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        searchTerms.length === 0 || searchTerms.every((term) => searchableText.includes(term))

      const matchesProject =
        filters.projects.length === 0 || filters.projects.includes(component.project)

      const matchesTech =
        filters.techStack.length === 0 ||
        filters.techStack.some((t) => component.techStack.includes(t))

      const matchesStyle =
        filters.style.length === 0 ||
        filters.style.some((s) => component.style.includes(s))

      const matchesCategory =
        filters.category.length === 0 || filters.category.includes(component.category)

      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((t) => (component.tags || []).includes(t))

      const matchesScene =
        filters.scene.length === 0 ||
        filters.scene.some((s) => (component.scene || []).includes(s))

      return matchesSearch && matchesProject && matchesTech && matchesStyle && matchesCategory && matchesTags && matchesScene
    }).sort((a, b) => {
      if (filters.sort === 'name') return a.name.localeCompare(b.name)
      if (filters.sort === 'project') {
        const projectDiff = a.project.localeCompare(b.project)
        return projectDiff || a.name.localeCompare(b.name)
      }
      const previewDiff = previewPriority(a) - previewPriority(b)
      if (previewDiff !== 0) return previewDiff
      return a.name.localeCompare(b.name)
    })
  }, [allComponents, filters])

  const hasActiveFilters =
    !!filters.search ||
    filters.projects.length > 0 ||
    filters.techStack.length > 0 ||
    filters.style.length > 0 ||
    filters.category.length > 0 ||
    filters.tags.length > 0 ||
    filters.scene.length > 0 ||
    filters.sort !== 'preview'

  const allTags = useMemo(
    () => Array.from(new Set(allComponents.flatMap((c) => c.tags || []))).sort(),
    [allComponents]
  )

  const allScenes = useMemo(
    () => Array.from(new Set(allComponents.flatMap((c) => c.scene || []))).sort(),
    [allComponents]
  )

  return {
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
  }
}
