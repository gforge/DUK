import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index'
import App from './App'
import { initStore } from './api/storage'
import { loadState } from './api/storage'
import { SEED_STATE } from './api/seed'
import type { AppState } from './api/schemas'

/**
 * Migrate persisted state to add any new top-level fields introduced in later versions.
 * This avoids wiping user data when the schema grows.
 */
function migrateState(state: AppState): AppState {
  return {
    ...state,
    instructionTemplates: state.instructionTemplates ?? SEED_STATE.instructionTemplates,
  }
}

// Boot: load persisted state from localStorage, or fall back to seed data
const persisted = loadState()
initStore(persisted ? migrateState(persisted) : SEED_STATE)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
