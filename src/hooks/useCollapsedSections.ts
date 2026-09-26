import { useCallback, useEffect, useState } from 'react'

/**
 * Remembers which sections the user has collapsed (all open by default),
 * persisted per `storageKey` in localStorage.
 */
export function useCollapsedSections<T extends string>(storageKey: string) {
  const [collapsed, setCollapsed] = useState<Set<T>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return new Set(JSON.parse(raw) as T[])
    } catch {
      // ignore parse errors
    }
    return new Set()
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsed)))
    } catch {
      // ignore write failures
    }
  }, [collapsed, storageKey])

  const toggle = useCallback((id: T) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /** Collapse every id when any is open, otherwise expand all. */
  const toggleAll = useCallback((ids: readonly T[]) => {
    setCollapsed((prev) => (ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)))
  }, [])

  const isOpen = useCallback((id: T) => !collapsed.has(id), [collapsed])

  return { collapsed, isOpen, toggle, toggleAll }
}
