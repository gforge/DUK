import { describe, expect, it, vi } from 'vitest'

import { initializeStoreFromRaw } from '@/api/bootstrap'
import type { AppState } from '@/api/schemas'
import { CURRENT_DEMO_DATA_VERSION, CURRENT_SCHEMA_VERSION } from '@/api/schemaVersion'
import { buildMinimalSeed, SEED_STATE } from '@/api/seed'

describe('initializeStoreFromRaw', () => {
  it('initializes first launch with current minimal seed', () => {
    const init = vi.fn()
    const today = new Date('2032-05-10T12:00:00.000Z')

    const error = initializeStoreFromRaw(null, { today, init })

    expect(error).toBeUndefined()
    expect(init).toHaveBeenCalledTimes(1)
    const state = init.mock.calls[0][0] as AppState
    expect(state.demoDataVersion).toBe(CURRENT_DEMO_DATA_VERSION)
    expect(state.patients.length).toBeGreaterThan(0)
    expect(state.policyRules.length).toBeGreaterThan(0)
    expect(state.journeyTemplates.length).toBeGreaterThan(0)
    expect(state.questionnaireTemplates.length).toBeGreaterThan(0)
    expect(state.journalTemplates.length).toBeGreaterThan(0)
    expect(state.researchModules.length).toBeGreaterThan(0)
    expect(state.instructionTemplates.length).toBeGreaterThan(0)
    expect(state.patientJourneys.find((j) => j.id === 'pj-1')?.startDate).toBe('2032-04-26')
  })

  it('preserves current-version demo state', () => {
    const init = vi.fn()
    const stored = {
      ...structuredClone(SEED_STATE),
      patients: [
        {
          ...SEED_STATE.patients[0],
          id: 'custom-patient',
          displayName: 'Custom Patient',
        },
      ],
    }

    const error = initializeStoreFromRaw(stored, { init })

    expect(error).toBeUndefined()
    expect(init).toHaveBeenCalledWith(stored)
  })

  it('refreshes valid legacy demo state when the bundled example version changes', () => {
    const init = vi.fn()
    const today = new Date('2032-05-10T12:00:00.000Z')
    const stored = {
      ...structuredClone(SEED_STATE),
      schemaVersion: CURRENT_SCHEMA_VERSION - 1,
    }
    delete (stored as Partial<AppState>).demoDataVersion

    const error = initializeStoreFromRaw(stored, { today, init })

    expect(error).toBeUndefined()
    expect(init).toHaveBeenCalledTimes(1)
    const state = init.mock.calls[0][0] as AppState
    expect(state.demoDataVersion).toBe(CURRENT_DEMO_DATA_VERSION)
    expect(state.patients.length).toBe(SEED_STATE.patients.length)
    expect(state.patientJourneys.find((j) => j.id === 'pj-1')?.startDate).toBe('2032-04-26')
  })

  it('does not initialize the store when migration fails', () => {
    const init = vi.fn()

    const error = initializeStoreFromRaw({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 }, { init })

    expect(error?.ok).toBe(false)
    expect(error?.reason).toBe('downgrade')
    expect(init).not.toHaveBeenCalled()
  })

  it('preserves current imported state even when core arrays are empty', () => {
    const init = vi.fn()
    const stored = {
      ...buildMinimalSeed(new Date('2032-05-10T12:00:00.000Z')),
      patients: [],
      cases: [],
    }

    const error = initializeStoreFromRaw(stored, { init })

    expect(error).toBeUndefined()
    expect(init).toHaveBeenCalledWith(stored)
  })
})
