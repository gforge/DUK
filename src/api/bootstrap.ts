import type { MigrationResultErr } from './migrations'
import { runMigrations } from './migrations'
import { CURRENT_DEMO_DATA_VERSION } from './schemaVersion'
import { buildMinimalSeed } from './seed'
import { initStore } from './storage'

export interface BootstrapOptions {
  today?: Date
  init?: typeof initStore
}

export function initializeStoreFromRaw(
  raw: unknown | null,
  { today = new Date(), init = initStore }: BootstrapOptions = {},
): MigrationResultErr | undefined {
  if (raw === null) {
    init(buildMinimalSeed(today))
    return undefined
  }

  const result = runMigrations(raw)
  if (!result.ok) return result

  if (result.state.demoDataVersion < CURRENT_DEMO_DATA_VERSION) {
    init(buildMinimalSeed(today))
  } else {
    init(result.state)
  }

  return undefined
}
