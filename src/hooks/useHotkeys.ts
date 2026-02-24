import { useEffect, useRef } from 'react'

type HotkeyMap = Record<string, () => void>

/**
 * Simple hotkeys hook — no external dependencies.
 *
 * Supports:
 *   - Single keys: "/" => action
 *   - Sequences: "g d" => action (typed within 1 second)
 */
export function useHotkeys(hotkeys: HotkeyMap) {
  const sequenceRef = useRef<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs/textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const key = e.key

      // Single-character shortcuts
      if (hotkeys[key]) {
        e.preventDefault()
        hotkeys[key]()
        return
      }

      // Sequence shortcuts (e.g. "g d")
      sequenceRef.current.push(key)
      const seq = sequenceRef.current.join(' ')

      if (hotkeys[seq]) {
        e.preventDefault()
        hotkeys[seq]()
        sequenceRef.current = []
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }

      // Check if current sequence is a prefix of any hotkey
      const isPrefix = Object.keys(hotkeys).some((k) => k.startsWith(seq + ' '))
      if (!isPrefix) {
        sequenceRef.current = []
      }

      // Reset sequence after 1 second
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        sequenceRef.current = []
      }, 1000)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [hotkeys])
}
