import { useCallback, useEffect, useRef, useState } from 'react'
import { pushSnapshot, applyUndo, peekSnapshot, type UndoSnapshot } from '@/api/undoHistory'

interface UseEditorUndoOptions {
  /** Called after a successful undo so the consumer can refetch data. */
  onAfterUndo: () => void
}

interface UseEditorUndoReturn {
  /** Whether there is something to undo. */
  canUndo: boolean
  /** Human-readable description of the operation that would be undone. */
  undoDescription: string | null
  /** ISO timestamp of the operation that would be undone. */
  undoTimestamp: string | null
  /** Push a snapshot before a mutation. Pass a description shown in the undo tooltip. */
  push: (description: string) => void
  /** Undo the last operation. */
  undo: () => void
}

/**
 * Provides undo for the Journey Editor.
 * - Persists snapshots in localStorage via `src/api/undoHistory.ts`.
 * - Binds Ctrl+Z / Cmd+Z globally while the component is mounted.
 * - Call `push(description)` BEFORE every save/delete operation.
 * - Call `onAfterUndo` will trigger a full data refetch in the parent.
 */
export function useEditorUndo({ onAfterUndo }: UseEditorUndoOptions): UseEditorUndoReturn {
  const [peek, setPeek] = useState<UndoSnapshot | null>(() => peekSnapshot())
  // Keep onAfterUndo stable across renders without needing it in useCallback deps
  const onAfterUndoRef = useRef(onAfterUndo)
  useEffect(() => {
    onAfterUndoRef.current = onAfterUndo
  })

  const push = useCallback((description: string) => {
    pushSnapshot(description)
    setPeek(peekSnapshot())
  }, [])

  const undo = useCallback(() => {
    const snapshot = applyUndo()
    if (snapshot) {
      setPeek(peekSnapshot())
      onAfterUndoRef.current()
    }
  }, [])

  // Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Don't intercept when focus is inside an input/textarea/contenteditable
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
          return
        }
        e.preventDefault()
        const snapshot = applyUndo()
        if (snapshot) {
          setPeek(peekSnapshot())
          onAfterUndoRef.current()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return {
    canUndo: peek !== null,
    undoDescription: peek?.description ?? null,
    undoTimestamp: peek?.timestamp ?? null,
    push,
    undo,
  }
}
