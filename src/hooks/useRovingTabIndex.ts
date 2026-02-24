import { useRef, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

/**
 * Roving tabindex hook for list navigation with arrow keys.
 * Returns handlers to attach to each list item.
 */
export function useRovingTabIndex(listLength: number) {
  const focusedIndex = useRef(0)

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === focusedIndex.current ? 0 : -1,
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          focusedIndex.current = Math.min(index + 1, listLength - 1)
          const items = document.querySelectorAll<HTMLElement>('[data-list-item]')
          items[focusedIndex.current]?.focus()
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          focusedIndex.current = Math.max(index - 1, 0)
          const items = document.querySelectorAll<HTMLElement>('[data-list-item]')
          items[focusedIndex.current]?.focus()
        }
        if (e.key === 'Home') {
          e.preventDefault()
          focusedIndex.current = 0
          const items = document.querySelectorAll<HTMLElement>('[data-list-item]')
          items[0]?.focus()
        }
        if (e.key === 'End') {
          e.preventDefault()
          focusedIndex.current = listLength - 1
          const items = document.querySelectorAll<HTMLElement>('[data-list-item]')
          items[listLength - 1]?.focus()
        }
      },
      onClick: () => {
        focusedIndex.current = index
      },
      'data-list-item': true,
    }),
    [listLength],
  )

  return { getItemProps }
}
