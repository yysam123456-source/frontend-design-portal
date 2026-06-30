import { useState, useMemo, useCallback } from 'react'
import type { FilterState, ProjectMeta } from '../types'

export function useFilter(projects: ProjectMeta[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    techStack: [],
    style: [],
    category: [],
  })

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const toggleArrayFilter = useCallback(
    (key: 'techStack' | 'style' | 'category', value: string) => {
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
    setFilters({ search: '', techStack: [], style: [], category: [] })
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        !filters.search ||
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some((t) => t.toLowerCase().includes(searchLower))

      const matchesTech =
        filters.techStack.length === 0 ||
        filters.techStack.some((t) => project.techStack.includes(t))

      const matchesStyle =
        filters.style.length === 0 ||
        filters.style.some((s) => project.tags.includes(s))

      const matchesCategory =
        filters.category.length === 0 ||
        filters.category.includes(project.category)

      return matchesSearch && matchesTech && matchesStyle && matchesCategory
    })
  }, [projects, filters])

  const hasActiveFilters =
    !!filters.search ||
    filters.techStack.length > 0 ||
    filters.style.length > 0 ||
    filters.category.length > 0

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    filteredProjects,
    hasActiveFilters,
  }
}
