import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

// ─── getEffectiveSteps ────────────────────────────────────────────────────────

describe('getEffectiveSteps', () => {
  it('returns empty array for unknown journey id', () => {
    expect(service.getEffectiveSteps('nonexistent')).toEqual([])
  })

  it('returns steps from the journey template in offset order', () => {
    // pj-1 = p-1, Standard Fracture (6 steps)
    const steps = service.getEffectiveSteps('pj-1')
    expect(steps.length).toBe(6)
    // verify ascending offsetDays order
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].offsetDays).toBeGreaterThanOrEqual(steps[i - 1].offsetDays)
    }
  })

  it('schedules dates relative to the journey startDate', () => {
    const journey = SEED_STATE.patientJourneys.find((j) => j.id === 'pj-1')!
    const steps = service.getEffectiveSteps('pj-1')
    const firstStep = steps[0] // offsetDays = 1
    const startMs = new Date(journey.startDate).getTime()
    const expectedDate = new Date(startMs + 1 * 86_400_000).toISOString().slice(0, 10)
    expect(firstStep.scheduledDate).toBe(expectedDate)
  })

  it('includes scoreAliases from the template entry', () => {
    const steps = service.getEffectiveSteps('pj-1')
    const week4Step = steps.find((s) => s.id === 'jte-std-3')!
    expect(week4Step.scoreAliases).toMatchObject({ PNRS_2: 'PNRS_week4', 'OSS.total': 'OSS_week4' })
  })

  it('applies ADD_STEP modification', () => {
    // Add a step via modifyPatientJourney
    service.modifyPatientJourney('pj-1', {
      type: 'ADD_STEP',
      addedByUserId: 'user-pal-1',
      reason: 'Extra wound check needed',
      entry: {
        id: 'step-extra',
        label: 'Day 20 extra',
        offsetDays: 20,
        windowDays: 1,
        order: 20,
        templateId: 'qt-wound-pain',
        scoreAliases: {},
        scoreAliasLabels: {},
        dashboardCategory: 'CONTROL' as const,
      },
    })
    const steps = service.getEffectiveSteps('pj-1')
    const extra = steps.find((s) => s.id === 'step-extra')
    expect(extra).toBeDefined()
    expect(extra!.isAdded).toBe(true)
    expect(extra!.label).toBe('Day 20 extra')
  })

  it('applies REMOVE_STEP modification', () => {
    service.modifyPatientJourney('pj-1', {
      type: 'REMOVE_STEP',
      addedByUserId: 'user-pal-1',
      reason: 'Patient skipped cast-off visit',
      stepId: 'jte-std-4', // Week 6-8
    })
    const steps = service.getEffectiveSteps('pj-1')
    expect(steps.find((s) => s.id === 'jte-std-4')).toBeUndefined()
    // All other standard steps still present
    expect(steps.length).toBe(5)
  })

  it('pj-8 uses Complex template steps directly', () => {
    // pj-8 was assigned to jt-complex from the start
    const steps = service.getEffectiveSteps('pj-8')
    expect(steps.length).toBe(7)
    expect(steps.some((s) => s.id === 'jte-cx-2')).toBe(true) // early wound check
  })

  it('research module replaceStepId replaces matching template step', () => {
    // pj-10: enrolled in rm-move-2026 which replaces jte-std-3 (Week 4)
    const steps = service.getEffectiveSteps('pj-10')
    // jte-std-3 should be gone; rme-move-1 should be there instead
    expect(steps.find((s) => s.id === 'jte-std-3')).toBeUndefined()
    const researchStep = steps.find((s) => s.id === 'rme-move-1')
    expect(researchStep).toBeDefined()
    expect(researchStep!.isResearch).toBe(true)
    expect(researchStep!.researchModuleId).toBe('rm-move-2026')
  })

  it('research module additive entry adds a standalone step', () => {
    // pj-10 also has rme-move-2 at day 90
    const steps = service.getEffectiveSteps('pj-10')
    const additiveStep = steps.find((s) => s.id === 'rme-move-2')
    expect(additiveStep).toBeDefined()
    expect(additiveStep!.isResearch).toBe(true)
    expect(additiveStep!.offsetDays).toBe(90)
  })

  it('research step inherits scheduledDate from replaced step', () => {
    const journey = SEED_STATE.patientJourneys.find((j) => j.id === 'pj-10')!
    const originalTemplate = SEED_STATE.journeyTemplates.find((jt) => jt.id === 'jt-standard')!
    const originalStep = originalTemplate.entries.find((e) => e.id === 'jte-std-3')!
    const expectedDate = new Date(
      new Date(journey.startDate).getTime() + originalStep.offsetDays * 86_400_000,
    )
      .toISOString()
      .slice(0, 10)

    const steps = service.getEffectiveSteps('pj-10')
    const researchStep = steps.find((s) => s.id === 'rme-move-1')!
    expect(researchStep.scheduledDate).toBe(expectedDate)
  })
})
