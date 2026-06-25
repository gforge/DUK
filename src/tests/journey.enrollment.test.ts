import { beforeEach,describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('enrollResearchModule', () => {
  it('adds a research module to a journey', () => {
    service.enrollResearchModule('pj-1', 'rm-move-2026')
    const journeys = service.getPatientJourneys('p-1')
    expect(journeys[0].researchModuleIds).toContain('rm-move-2026')
  })

  it('is idempotent — does not duplicate module id', () => {
    service.enrollResearchModule('pj-1', 'rm-move-2026')
    service.enrollResearchModule('pj-1', 'rm-move-2026')
    const journeys = service.getPatientJourneys('p-1')
    const count = journeys[0].researchModuleIds.filter((id) => id === 'rm-move-2026').length
    expect(count).toBe(1)
  })
})

describe('unenrollResearchModule', () => {
  it('removes a research module from a journey', () => {
    // pj-10 starts with rm-move-2026
    service.unenrollResearchModule('pj-10', 'rm-move-2026')
    const journeys = service.getPatientJourneys('p-10')
    expect(journeys[0].researchModuleIds).not.toContain('rm-move-2026')
  })
})
