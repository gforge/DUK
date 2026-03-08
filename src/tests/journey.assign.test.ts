import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('assignPatientJourney', () => {
  it('creates a new active patient journey', () => {
    const journey = service.assignPatientJourney('p-1', 'jt-complex', '2026-01-01')
    expect(journey.patientId).toBe('p-1')
    expect(journey.journeyTemplateId).toBe('jt-complex')
    expect(journey.status).toBe('ACTIVE')
    expect(journey.modifications).toHaveLength(0)
  })

  it('allows parallel journeys for the same patient', () => {
    service.assignPatientJourney('p-1', 'jt-complex', '2026-01-01', undefined, ['rm-move-2026'])
    const journeys = service.getPatientJourneys('p-1')
    expect(journeys.length).toBeGreaterThanOrEqual(2)
    const research = journeys.find((j) => j.journeyTemplateId === 'jt-complex')
    expect(research?.researchModuleIds).toContain('rm-move-2026')
  })
})
