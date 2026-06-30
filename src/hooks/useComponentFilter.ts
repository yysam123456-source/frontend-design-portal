import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ComponentSummary, FilterState } from '../types'

interface UseComponentFilterResult {
  filters: FilterState
  updateFilter: (key: keyof FilterState, value: string | string[]) => void
  toggleArrayFilter: (key: 'projects' | 'techStack' | 'style' | 'category', value: string) => void
  clearFilters: () => void
  filteredComponents: ComponentSummary[]
  hasActiveFilters: boolean
  allComponents: ComponentSummary[]
  isLoading: boolean
}

export function useComponentFilter(): UseComponentFilterResult {
  const [allComponents, setAllComponents] = useState<ComponentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projects: [],
    techStack: [],
    style: [],
    category: [],
  })

  useEffect(() => {
    fetch('/data/index.json')
      .then((res) => res.json())
      .then((data) => {
        setAllComponents(data.components || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const toggleArrayFilter = useCallback(
    (key: 'projects' | 'techStack' | 'style' | 'category', value: string) => {
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
    setFilters({ search: '', projects: [], techStack: [], style: [], category: [] })
  }, [])

  const filteredComponents = useMemo(() => {
    return allComponents.filter((component) => {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        !filters.search ||
        component.name.toLowerCase().includes(searchLower) ||
        component.description.toLowerCase().includes(searchLower) ||
        component.style.some((s) => s.toLowerCase().includes(searchLower)) ||
        component.techStack.some((t) => t.toLowerCase().includes(searchLower))

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

      return matchesSearch && matchesProject && matchesTech && matchesStyle && matchesCategory
    })
  }, [allComponents, filters])

  const hasActiveFilters =
    !!filters.search ||
    filters.projects.length > 0 ||
    filters.techStack.length > 0 ||
    filters.style.length > 0 ||
    filters.category.length > 0

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    filteredComponents,
    hasActiveFilters,
    allComponents,
    isLoading,
  }
}
