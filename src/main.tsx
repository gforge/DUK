import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index'
import App from './App'
import { initStore } from './api/storage'
import { loadState } from './api/storage'
import { SEED_STATE } from './api/seed'

// Boot: load persisted state from localStorage, or fall back to seed data
const persisted = loadState()
initStore(persisted ?? SEED_STATE)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
