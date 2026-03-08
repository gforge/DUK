import { useCallback,useRef } from 'react'

/**
 * Saves the currently focused element and restores focus to it later.
 * Used when navigating from a list item into a detail view and back.
 */
export function useFocusRestore() {
  const savedRef = useRef<HTMLElement | null>(null)

  const save = useCallback(() => {
    savedRef.current = document.activeElement as HTMLElement | null
  }, [])

  const restore = useCallback(() => {
    savedRef.current?.focus()
    savedRef.current = null
  }, [])

  return { save, restore }
}
