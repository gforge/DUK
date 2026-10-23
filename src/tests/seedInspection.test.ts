import { describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { buildFakerSeed } from '@/api/seedFaker'
import { buildRealisticSeed } from '@/api/seedRealistic'

function isWorklistEligible(c: any): boolean {
  const mode = c.triageDecision?.contactMode
  if (mode === 'VISIT' || mode === 'PHONE' || mode === 'DIGITAL') return true
  if (
    c.nextStep === 'DOCTOR_VISIT' ||
    c.nextStep === 'NURSE_VISIT' ||
    c.nextStep === 'PHYSIO_VISIT' ||
    c.nextStep === 'PHONE_CALL' ||
    c.nextStep === 'DIGITAL_CONTROL'
  )
    return true
  return false
}

describe('Seed inspection', () => {
  it('realistic seed produces worklist-eligible cases', () => {
    const s = buildRealisticSeed()
    const total = s.cases.length
    const eligible = s.cases.filter((c: any) => isWorklistEligible(c)).length
    // Log for developer visibility when running tests locally

    console.log(`realistic seed: total=${total}, eligible=${eligible}`)
    expect(eligible).toBeGreaterThan(0)
  })

  it('faker seed produces worklist-eligible cases', async () => {
    const s = await buildFakerSeed()
    const total = s.cases.length
    const eligible = s.cases.filter((c: any) => isWorklistEligible(c)).length

    console.log(`faker seed: total=${total}, eligible=${eligible}`)
    expect(eligible).toBeGreaterThan(0)
  })

  it('minimal seed shows every triage pathway', () => {
    const decided = SEED_STATE.cases.filter((c) => c.triageDecision)
    const has = (pred: (c: (typeof decided)[number]) => boolean) => decided.some(pred)

    for (const mode of ['VISIT', 'PHONE', 'DIGITAL', 'CLOSE'] as const) {
      expect(
        has((c) => c.triageDecision!.contactMode === mode),
        mode,
      ).toBe(true)
    }
    for (const role of ['DOCTOR', 'NURSE', 'PHYSIO'] as const) {
      expect(
        has((c) => c.triageDecision!.careRole === role),
        role,
      ).toBe(true)
    }
    for (const assignment of ['ANY', 'PAL', 'NAMED'] as const) {
      expect(
        has((c) => c.triageDecision!.assignmentMode === assignment),
        assignment,
      ).toBe(true)
    }
    for (const status of ['NEW', 'NEEDS_REVIEW', 'TRIAGED', 'FOLLOWING_UP', 'CLOSED'] as const) {
      expect(
        SEED_STATE.cases.some((c) => c.status === status),
        status,
      ).toBe(true)
    }

    // Radiograph + visit: awaiting booking, and booked at Danderyd and elsewhere.
    const xrayCases = decided.filter((c) => c.triageDecision!.xrayBeforeVisit)
    expect(xrayCases.some((c) => c.status === 'TRIAGED')).toBe(true)
    const xrayLocations = new Set(
      xrayCases
        .flatMap((c) => (c.bookings ?? []).filter((b) => b.type === 'XRAY'))
        .map((b) => b.location),
    )
    expect(xrayLocations.has('Danderyd')).toBe(true)
    expect(xrayLocations.size).toBeGreaterThan(1)

    // Overdue worklist item
    expect(
      SEED_STATE.cases.some(
        (c) => c.status === 'TRIAGED' && c.deadline && new Date(c.deadline) < new Date(),
      ),
    ).toBe(true)
  })

  it('minimal seed has consistent cross-references', () => {
    const patientIds = new Set(SEED_STATE.patients.map((p) => p.id))
    const caseIds = new Set(SEED_STATE.cases.map((c) => c.id))
    const episodeIds = new Set(SEED_STATE.episodesOfCare.map((e) => e.id))

    for (const c of SEED_STATE.cases) {
      expect(patientIds.has(c.patientId), c.id).toBe(true)
      if (c.episodeId) expect(episodeIds.has(c.episodeId), c.id).toBe(true)
    }
    for (const j of SEED_STATE.patientJourneys) {
      expect(episodeIds.has(j.episodeId), j.id).toBe(true)
    }
    for (const fr of SEED_STATE.formResponses) {
      if (fr.caseId) expect(caseIds.has(fr.caseId), fr.id).toBe(true)
    }
    for (const ev of SEED_STATE.auditEvents) {
      expect(caseIds.has(ev.caseId), ev.id).toBe(true)
    }
    expect(new Set(SEED_STATE.auditEvents.map((e) => e.id)).size).toBe(
      SEED_STATE.auditEvents.length,
    )
  })
})
