import { beforeEach, describe, expect, it } from 'vitest'

import { buildMinimalSeed, SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

const TODAY = new Date('2032-05-10T12:00:00.000Z')
const DAY = 86_400_000
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY)

describe('conservative → operative seed examples (distal radius)', () => {
  const state = buildMinimalSeed(TODAY)

  it.each([
    ['p-27', 'ep-27', 'pj-drc-27a', 'pj-drc-27b', 'case-27'],
    ['p-28', 'ep-28', 'pj-drc-28a', 'pj-drc-28b', 'case-28'],
  ])(
    '%s: cast journey completed, operative journey active in the same episode',
    (patientId, episodeId, castId, opId, caseId) => {
      const cast = state.patientJourneys.find((j) => j.id === castId)!
      const op = state.patientJourneys.find((j) => j.id === opId)!
      expect(cast.patientId).toBe(patientId)
      expect(cast.episodeId).toBe(episodeId)
      expect(op.episodeId).toBe(episodeId)

      // Phase 1: cast, anchored on the injury
      expect(cast.journeyTemplateId).toBe('jt-distal-radius-conservative')
      expect(cast.status).toBe('COMPLETED')
      expect(cast.transition?.type).toBe('INJURY')
      expect(cast.transition?.fromJourneyId).toBeUndefined()

      // Phase 2: operated, re-anchored on the surgery date
      expect(op.journeyTemplateId).toBe('jt-distal-radius')
      expect(op.status).toBe('ACTIVE')
      expect(op.phaseType).toBe('POST_OP')
      expect(op.transition?.type).toBe('SURGERY_COMPLETED')
      expect(op.transition?.fromJourneyId).toBe(castId)
      expect(op.startDate > cast.startDate).toBe(true)

      // The X-ray review that prompted surgery: decision 3 days before the operation
      const kase = state.cases.find((c) => c.id === caseId)!
      const xray = kase.reviews.find((r) => r.type === 'XRAY')!
      expect(xray.outcome).toBe('PROBLEM')
      expect(daysBetween(xray.reviewedAt!.slice(0, 10), op.startDate)).toBe(3)

      // Forms were answered in both phases
      expect(state.formResponses.some((r) => r.patientJourneyId === castId)).toBe(true)
      expect(state.formResponses.some((r) => r.patientJourneyId === opId)).toBe(true)
    },
  )

  it('lands in the expected dashboard column today', () => {
    initStore(structuredClone(SEED_STATE))
    const byId = new Map(service.getCasesForDashboard().map((c) => [c.id, c]))
    expect(byId.get('case-27')?.activeCategory).toBe('ACUTE') // post-op day 11
    expect(byId.get('case-28')?.activeCategory).toBe('SUBACUTE') // post-op week 4
  })
})

describe('template switch within the same event (Axel, ankle fracture)', () => {
  beforeEach(() => {
    initStore(structuredClone(SEED_STATE))
  })

  it('keeps the surgery date as anchor and removes the already-closed step', () => {
    const complex = SEED_STATE.patientJourneys.find((j) => j.id === 'pj-ax-21b')!
    const standard = SEED_STATE.patientJourneys.find((j) => j.id === 'pj-ax-21a')!
    expect(complex.startDate).toBe(standard.startDate)
    expect(daysBetween(complex.startDate, complex.joinedAt)).toBe(3)
    const stepIds = service.getEffectiveSteps('pj-ax-21b').map((s) => s.id)
    expect(stepIds).not.toContain('jte-cx-1') // Dag 1–2 closed before the switch
    expect(stepIds).toContain('jte-cx-2') // Dag 3–5 early wound check kept
  })
})
