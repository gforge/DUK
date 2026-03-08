import './i18n/index'

import React from 'react'
import ReactDOM from 'react-dom/client'

import type { MigrationResultErr } from './api/migrations'
import { runMigrations } from './api/migrations'
import { SEED_STATE } from './api/seed'
import { initStore, loadState } from './api/storage'
import App from './App'

// Boot: load raw persisted state, migrate to current schema version, or fall
// back to seed data. If migration is impossible show a blocking overlay.
const raw = loadState()
let migrationError: MigrationResultErr | undefined

if (raw === null) {
  // First launch or cleared storage — start with seed data
  initStore(SEED_STATE)
} else {
  const result = runMigrations(raw)
  if (result.ok) {
    initStore(result.state)
  } else {
    // Cannot migrate — render the overlay without touching the store
    migrationError = result
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App migrationError={migrationError} />
  </React.StrictMode>,
)
