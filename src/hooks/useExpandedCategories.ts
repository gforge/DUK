import { useCallback, useEffect, useState } from 'react'
import type { CaseCategory } from '@/api/schemas'

// key used in localStorage for this preference; kept outside hook so tests can share
export const EXPANDED_STORAGE_KEY = 'dashboard.expandedCategories'

export function useExpandedCategories() {
  const [expanded, setExpanded] = useState<Set<CaseCategory>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem(EXPANDED_STORAGE_KEY)
      if (raw) return new Set(JSON.parse(raw) as CaseCategory[])
    } catch {
      // ignore parse errors
    }
    return new Set()
  })

  const toggleExpanded = useCallback((cat: CaseCategory) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  useEffect(() => {
    try {
      const arr = Array.from(expanded)
      localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(arr))
    } catch {
      // ignore write failures
    }
  }, [expanded])

  return { expanded, toggleExpanded }
}
