import type { AppState } from './schemas'

const STORAGE_KEY = 'duk_app_state'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// In-memory store singleton — UI never touches localStorage directly
let memoryStore: AppState | null = null

export function getStore(): AppState {
  if (memoryStore) return memoryStore
  const persisted = loadState()
  if (persisted) {
    memoryStore = persisted
    return memoryStore
  }
  throw new Error('Store not initialised — call initStore() first')
}

export function setStore(state: AppState): void {
  memoryStore = state
  saveState(state)
}

export function patchStore(updater: (draft: AppState) => AppState): AppState {
  const next = updater(getStore())
  setStore(next)
  return next
}

export function initStore(state: AppState): void {
  memoryStore = state
  saveState(state)
}

export function resetStore(): void {
  memoryStore = null
  clearState()
}
