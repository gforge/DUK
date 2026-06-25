/**
 * Journey-editor undo history, persisted in a separate localStorage key.
 * Stores up to MAX_STACK snapshots of the four editor collections
 * (journeyTemplates, instructionTemplates, questionnaireTemplates, researchModules).
 * Never touches the main duk_app_state key directly — uses getStore / patchStore.
 */
import type {
  InstructionTemplate,
  JourneyTemplate,
  QuestionnaireTemplate,
  ResearchModule,
} from './schemas'
import { getStore, patchStore } from './storage'

const UNDO_KEY = 'duk_undo_history'
const MAX_STACK = 30

export interface UndoSnapshot {
  description: string
  timestamp: string
  data: {
    journeyTemplates: JourneyTemplate[]
    instructionTemplates: InstructionTemplate[]
    questionnaireTemplates: QuestionnaireTemplate[]
    researchModules: ResearchModule[]
  }
}

function loadStack(): UndoSnapshot[] {
  try {
    const raw = localStorage.getItem(UNDO_KEY)
    return raw ? (JSON.parse(raw) as UndoSnapshot[]) : []
  } catch {
    return []
  }
}

function saveStack(stack: UndoSnapshot[]): void {
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(stack))
  } catch {
    // Storage quota exceeded — drop oldest entries and retry once
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify(stack.slice(0, 10)))
    } catch {
      /* give up */
    }
  }
}

/**
 * Capture a snapshot of the current editor state BEFORE a mutation.
 * Call this synchronously before every `await client.save*` / `client.delete*`.
 */
export function pushSnapshot(description: string): void {
  const state = getStore()
  const snapshot: UndoSnapshot = {
    description,
    timestamp: new Date().toISOString(),
    data: {
      journeyTemplates: JSON.parse(JSON.stringify(state.journeyTemplates)),
      instructionTemplates: JSON.parse(JSON.stringify(state.instructionTemplates)),
      questionnaireTemplates: JSON.parse(JSON.stringify(state.questionnaireTemplates)),
      researchModules: JSON.parse(JSON.stringify(state.researchModules)),
    },
  }
  const stack = loadStack()
  saveStack([snapshot, ...stack].slice(0, MAX_STACK))
}

/**
 * Pop the most recent snapshot and restore the store to that state.
 * Returns the snapshot that was applied (for description display), or null if stack is empty.
 */
export function applyUndo(): UndoSnapshot | null {
  const stack = loadStack()
  if (!stack.length) return null
  const [snapshot, ...rest] = stack
  patchStore((s) => ({
    ...s,
    journeyTemplates: snapshot.data.journeyTemplates,
    instructionTemplates: snapshot.data.instructionTemplates,
    questionnaireTemplates: snapshot.data.questionnaireTemplates,
    researchModules: snapshot.data.researchModules,
  }))
  saveStack(rest)
  return snapshot
}

/** Peek at what would be undone without modifying the stack. */
export function peekSnapshot(): UndoSnapshot | null {
  return loadStack()[0] ?? null
}

/** Get the full undo stack (for history panel display). */
export function getStack(): UndoSnapshot[] {
  return loadStack()
}

/** Clear the entire undo history (e.g. after a seed reset). */
export function clearUndoHistory(): void {
  localStorage.removeItem(UNDO_KEY)
}
