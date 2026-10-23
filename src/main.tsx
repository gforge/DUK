import './i18n/index'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { initializeStoreFromRaw } from './api/bootstrap'
import type { MigrationResultErr } from './api/migrations'
import { loadState } from './api/storage'
import App from './App'

// Boot: load raw persisted state, migrate to current schema version, or fall
// back to seed data. If migration is impossible show a blocking overlay.
const raw = loadState()
const migrationError: MigrationResultErr | undefined = initializeStoreFromRaw(raw)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App migrationError={migrationError} />
  </React.StrictMode>,
)
