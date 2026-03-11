import { describe, expect, it } from 'vitest'

import { runMigrations } from '@/api/migrations'
import { CURRENT_SCHEMA_VERSION } from '@/api/schemaVersion'
// Helper that returns a minimal valid state at the given version by taking the
// seed state and overriding the schemaVersion. We don't need a full seed,
// just enough shape for the validator to succeed; easiest is to start from the
// known seed and trust migrations to not break it.
import { SEED_STATE } from '@/api/seed'

function minimalState(version: number): unknown {
  // clone and override version – seed contains all required top‑level arrays
  return { ...SEED_STATE, schemaVersion: version }
}

describe('runMigrations', () => {
  it('returns ok when data already at current version and valid', () => {
    const raw = minimalState(CURRENT_SCHEMA_VERSION)
    const result = runMigrations(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    }
  })

  it('returns invalid reason when stored version equals current but validation fails', () => {
    const raw = { schemaVersion: CURRENT_SCHEMA_VERSION, totallyBogus: 123 }
    const result = runMigrations(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid')
      expect(result.storedVersion).toBe(CURRENT_SCHEMA_VERSION)
    }
  })

  it('returns downgrade when stored version is newer', () => {
    const raw = { schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    const result = runMigrations(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('downgrade')
    }
  })

  it('returns no-path when there is no migration chain', () => {
    // runMigrations should return "no-path" when the stored version is
    // lower than any migration `from` value. passing -1 achieves that without
    // needing to mutate the chain.
    const res2 = runMigrations({ schemaVersion: -1 })
    expect(res2.ok).toBe(false)
    if (!res2.ok) {
      expect(res2.reason).toBe('no-path')
    }
  })
})
