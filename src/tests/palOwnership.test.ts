import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import {
  hasPalOwnerForCase,
  resolveResponsiblePhysicianUserIdForCase,
  updateEpisodeResponsibleUser,
  updateJourneyResponsiblePhysicianUser,
} from '@/api/service'
import { getStore, initStore, setStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('pal ownership resolver', () => {
  it('prioritizes journey PAL over episode and patient PAL', () => {
    const state = getStore()
    setStore({
      ...state,
      patients: state.patients.map((p) => (p.id === 'p-1' ? { ...p, palId: 'user-doc-1' } : p)),
    })

    updateEpisodeResponsibleUser('ep-1', 'user-pal-1')
    updateJourneyResponsiblePhysicianUser('pj-1', 'user-nurse-1')

    expect(resolveResponsiblePhysicianUserIdForCase('case-1')).toBe('user-nurse-1')
  })

  it('falls back to episode responsible user when journey PAL is not set', () => {
    const state = getStore()
    setStore({
      ...state,
      patients: state.patients.map((p) => (p.id === 'p-1' ? { ...p, palId: 'user-doc-1' } : p)),
    })

    updateJourneyResponsiblePhysicianUser('pj-1', undefined)
    updateEpisodeResponsibleUser('ep-1', 'user-pal-1')

    expect(resolveResponsiblePhysicianUserIdForCase('case-1')).toBe('user-pal-1')
  })

  it('falls back to patient PAL when journey and episode PAL are missing', () => {
    const state = getStore()
    setStore({
      ...state,
      patients: state.patients.map((p) => (p.id === 'p-1' ? { ...p, palId: 'user-doc-1' } : p)),
    })

    updateJourneyResponsiblePhysicianUser('pj-1', undefined)
    updateEpisodeResponsibleUser('ep-1', undefined)

    expect(resolveResponsiblePhysicianUserIdForCase('case-1')).toBe('user-doc-1')
  })

  it('returns null/false when PAL ownership is missing on all levels', () => {
    const state = getStore()
    setStore({
      ...state,
      patients: state.patients.map((p) => (p.id === 'p-1' ? { ...p, palId: undefined } : p)),
    })

    updateJourneyResponsiblePhysicianUser('pj-1', undefined)
    updateEpisodeResponsibleUser('ep-1', undefined)

    expect(resolveResponsiblePhysicianUserIdForCase('case-1')).toBeNull()
    expect(hasPalOwnerForCase('case-1')).toBe(false)
  })
})
