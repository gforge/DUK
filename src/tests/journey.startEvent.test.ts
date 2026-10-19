import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('assignPatientJourney — triggering event', () => {
  it('records the event as the first-phase transition anchored on the event date', () => {
    const journey = service.assignPatientJourney(
      'p-1',
      'jt-distal-radius-conservative',
      '2026-03-10',
      undefined,
      [],
      [],
      undefined,
      undefined,
      { type: 'INJURY', triggeredByUserId: 'user-nurse-1', note: 'Fall på is' },
    )
    expect(journey.startDate).toBe('2026-03-10')
    expect(journey.transition).toEqual({
      type: 'INJURY',
      triggeredAt: '2026-03-10T00:00:00.000Z',
      triggeredByUserId: 'user-nurse-1',
      note: 'Fall på is',
    })
    expect(journey.transition?.fromJourneyId).toBeUndefined()
  })

  it('derives the phase type from the event', () => {
    const assign = (type: Parameters<typeof service.phaseTypeForTrigger>[0]) =>
      service.assignPatientJourney(
        'p-1',
        'jt-standard',
        '2026-03-10',
        undefined,
        [],
        [],
        undefined,
        undefined,
        { type },
      )
    expect(assign('SURGERY_COMPLETED').phaseType).toBe('POST_OP')
    expect(assign('REFERRAL_RECEIVED').phaseType).toBe('REFERRAL')
    expect(assign('SURGERY_SCHEDULED').phaseType).toBe('WAITING_LIST')
    expect(assign('INJURY').phaseType).toBe('FOLLOWUP')
  })

  it('keeps the legacy behaviour when no event is given', () => {
    const journey = service.assignPatientJourney('p-1', 'jt-standard', '2026-03-10')
    expect(journey.transition).toBeUndefined()
    expect(journey.phaseType).toBe('FOLLOWUP')
  })

  it('seeded templates declare the event their reference date refers to', () => {
    for (const template of SEED_STATE.journeyTemplates) {
      expect(template.anchorEventType, template.id).toBeDefined()
    }
    const conservative = SEED_STATE.journeyTemplates.find(
      (t) => t.id === 'jt-distal-radius-conservative',
    )
    expect(conservative?.anchorEventType).toBe('INJURY')
    expect(conservative?.referenceDateLabel).toBe('Skadedatum')
  })
})
