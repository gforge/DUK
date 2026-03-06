import { describe, it, expect, beforeEach } from 'vitest'
import { initStore, patchStore } from '@/api/storage'
import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

// ─── resolvedInstruction hydration ──────────────────────────────────────────

describe('resolvedInstruction', () => {
  it('hydrates resolvedInstruction from instructionTemplateId', () => {
    // Find a journey that uses a template with instructionTemplateId on entries
    const templates = service.getJourneyTemplates()
    const templateWithInstruction = templates.find((t) =>
      t.entries.some((e) => e.instructionTemplateId),
    )
    if (!templateWithInstruction) return // skip if no seed has it

    // Find or create a patient journey using this template
    const journeys = service.getPatientJourneys()
    let journey = journeys.find((j) => j.journeyTemplateId === templateWithInstruction.id)
    if (!journey) {
      journey = service.assignPatientJourney('p-1', templateWithInstruction.id, '2026-01-01')
    }

    const steps = service.getEffectiveSteps(journey.id)
    const withInstruction = steps.find((s) => s.resolvedInstruction)
    expect(withInstruction).toBeDefined()
    expect(withInstruction!.resolvedInstruction!.length).toBeGreaterThan(0)
  })

  it('falls back to instructionText when no instructionTemplateId', () => {
    // Create a template with instructionText only
    const template = service.saveJourneyTemplate({
      name: 'Instruction Text Test',
      description: 'Test',
      referenceDateLabel: 'Startdatum',
      entries: [
        {
          id: 'ite-1',
          label: 'Day 1',
          offsetDays: 1,
          windowDays: 1,
          order: 1,
          templateId: 'qt-wound-pain',
          scoreAliases: {},
          scoreAliasLabels: {},
          dashboardCategory: 'ACUTE' as const,
          instructionText: 'Custom inline instruction text',
        },
      ],
    })
    const journey = service.assignPatientJourney('p-1', template.id, '2026-01-01')
    const steps = service.getEffectiveSteps(journey.id)
    expect(steps[0].resolvedInstruction).toBe('Custom inline instruction text')
  })

  it('expands a recurring entry into multiple occurrences up to the horizon', () => {
    const template = service.saveJourneyTemplate({
      name: 'Recurrence Test',
      referenceDateLabel: 'Startdatum',
      entries: [
        {
          id: 'rec-1',
          label: 'Halvårsuppföljning',
          offsetDays: 180,
          windowDays: 14,
          order: 1,
          scoreAliases: {},
          scoreAliasLabels: {},
          dashboardCategory: 'CONTROL' as const,
          recurrenceIntervalDays: 182,
        },
      ],
    })
    // 5 years horizon => 365*5 = 1825 days. First at 180, then 362, 544, 726, 908, 1090, 1272, 1454, 1636, 1818 = 10 occurrences
    const journey = service.assignPatientJourney('p-1', template.id, '2024-01-01')
    const steps = service.getEffectiveSteps(journey.id)

    expect(steps.length).toBeGreaterThan(1)
    expect(steps.every((s) => s.isRecurring)).toBe(true)
    // IDs should follow the __r0, __r1, etc. convention
    expect(steps[0].id).toBe('rec-1__r0')
    expect(steps[1].id).toBe('rec-1__r1')
    // First occurrence scheduled at startDate + 180 days
    const startMs = new Date('2024-01-01').getTime()
    const expected0 = new Date(startMs + 180 * 86_400_000).toISOString().slice(0, 10)
    expect(steps[0].scheduledDate).toBe(expected0)
    // Second occurrence at first + 182 days (no completion recorded)
    const expected1 = new Date(startMs + (180 + 182) * 86_400_000).toISOString().slice(0, 10)
    expect(steps[1].scheduledDate).toBe(expected1)
    // All must be within the horizon
    const horizonDate = new Date(startMs + 1825 * 86_400_000).toISOString().slice(0, 10)
    expect(steps.every((s) => s.scheduledDate <= horizonDate)).toBe(true)
  })

  it('re-anchors next recurring occurrence from actual completion date', () => {
    const template = service.saveJourneyTemplate({
      name: 'Late Completion Test',
      referenceDateLabel: 'Startdatum',
      entries: [
        {
          id: 'late-1',
          label: 'Uppföljning',
          offsetDays: 90,
          windowDays: 14,
          order: 1,
          scoreAliases: {},
          scoreAliasLabels: {},
          dashboardCategory: 'CONTROL' as const,
          recurrenceIntervalDays: 180,
        },
      ],
    })
    const journey = service.assignPatientJourney('p-1', template.id, '2024-01-01')

    // Simulate occurrence 0 being completed 60 days late (at day 150)
    const lateCompletionDate = '2024-06-29' // 2024-01-01 + 150 days
    service.recordRecurringCompletion(journey.id, 'late-1', 0, lateCompletionDate)

    const steps = service.getEffectiveSteps(journey.id)
    // Occurrence 0 is still at day 90
    expect(steps[0].scheduledDate).toBe('2024-03-31') // 2024-01-01 + 90 days
    // Occurrence 1 should be re-anchored: max(day 90 + 180, day 150 + 180) = day 330
    const startMs = new Date('2024-01-01').getTime()
    const expectedNext = new Date(
      Math.max(
        startMs + 90 * 86_400_000 + 180 * 86_400_000,
        new Date(lateCompletionDate).getTime() + 180 * 86_400_000,
      ),
    )
      .toISOString()
      .slice(0, 10)
    expect(steps[1].scheduledDate).toBe(expectedNext)
  })
})

// ─── recordRecurringCompletion ─────────────────────────────────────────────────

describe('recordRecurringCompletion', () => {
  it('adds a completion record to the journey', () => {
    const journey = service.getPatientJourneys('p-1')[0]
    const updated = service.recordRecurringCompletion(journey.id, 'some-step', 0, '2024-06-01')
    expect(updated.recurringCompletions).toHaveLength(1)
    expect(updated.recurringCompletions[0]).toMatchObject({
      stepId: 'some-step',
      occurrenceIndex: 0,
      completedAt: '2024-06-01',
    })
  })

  it('is idempotent — calling twice does not duplicate the record', () => {
    const journey = service.getPatientJourneys('p-1')[0]
    service.recordRecurringCompletion(journey.id, 'some-step', 0, '2024-06-01')
    const updated = service.recordRecurringCompletion(journey.id, 'some-step', 0, '2024-06-01')
    expect(updated.recurringCompletions).toHaveLength(1)
  })
})

// ─── pauseJourney / resumeJourney ─────────────────────────────────────────────

describe('pauseJourney / resumeJourney', () => {
  it('sets status to SUSPENDED and records pausedAt', () => {
    const before = service.getPatientJourneys('p-1')[0]
    expect(before.status).toBe('ACTIVE')
    const paused = service.pauseJourney(before.id)
    expect(paused.status).toBe('SUSPENDED')
    expect(paused.pausedAt).toBeTruthy()
    expect(paused.totalPausedDays).toBe(0)
  })

  it('throws when pausing a non-ACTIVE journey', () => {
    const j = service.getPatientJourneys('p-1')[0]
    service.pauseJourney(j.id)
    expect(() => service.pauseJourney(j.id)).toThrow()
  })

  it('resumes correctly and accumulates totalPausedDays', () => {
    const j = service.getPatientJourneys('p-1')[0]
    service.pauseJourney(j.id)
    const resumed = service.resumeJourney(j.id)
    expect(resumed.status).toBe('ACTIVE')
    expect(resumed.pausedAt).toBeNull()
    // totalPausedDays must be >= 0 (typically 0 for an immediate resume in tests)
    expect(resumed.totalPausedDays).toBeGreaterThanOrEqual(0)
  })

  it('throws when resuming a non-SUSPENDED journey', () => {
    const j = service.getPatientJourneys('p-1')[0]
    expect(() => service.resumeJourney(j.id)).toThrow()
  })

  it('step scheduled dates shift forward by accumulated pause days', () => {
    const journey = service.getPatientJourneys('p-1')[0]

    // Get baseline step dates while ACTIVE
    const stepsBefore = service.getEffectiveSteps(journey.id)

    // Manually inject a 7-day pause via direct store patch so we can test the shift
    // without having to wait 7 real days in a test.
    patchStore((s) => ({
      ...s,
      patientJourneys: s.patientJourneys.map((j) =>
        j.id === journey.id ? { ...j, totalPausedDays: 7 } : j,
      ),
    }))

    const stepsAfter = service.getEffectiveSteps(journey.id)

    // Every step's scheduledDate should be 7 days later than before
    for (let i = 0; i < stepsBefore.length; i++) {
      const beforeMs = new Date(stepsBefore[i].scheduledDate).getTime()
      const afterMs = new Date(stepsAfter[i].scheduledDate).getTime()
      expect(afterMs - beforeMs).toBe(7 * 86_400_000)
    }
  })
})

// ─── getMergedDueStepsForPatient ──────────────────────────────────────────────

describe('getMergedDueStepsForPatient', () => {
  it('returns empty array when patient has no journeys', () => {
    const result = service.getMergedDueStepsForPatient('nonexistent-patient', '2026-01-01')
    expect(result).toEqual([])
  })

  it('deduplicates steps with the same templateId from parallel journeys', () => {
    // Assign a second journey with the same template to p-1
    const original = service.getPatientJourneys('p-1')[0]
    service.assignPatientJourney('p-1', original.journeyTemplateId, original.startDate)

    // On the startDate + 1 day (first step for jt-standard), both journeys should
    // have the same form due.  getMergedDueStepsForPatient should deduplicate.
    const firstStepDate = new Date(new Date(original.startDate).getTime() + 1 * 86_400_000)
      .toISOString()
      .slice(0, 10)
    const merged = service.getMergedDueStepsForPatient('p-1', firstStepDate)

    // For each templateId there should be exactly one merged step
    const templateIds = merged.map((s) => s.templateId)
    const uniqueIds = [...new Set(templateIds)]
    expect(templateIds.length).toBe(uniqueIds.length)

    // The merged step covering both journeys should have journeyIds.length >= 2
    const bothJourneys = merged.find((s) => s.journeyIds.length >= 2)
    expect(bothJourneys).toBeTruthy()
  })
})

// ─── cancelJourney ────────────────────────────────────────────────────────────

describe('cancelJourney', () => {
  it('deletes the journey entirely when no form responses or recurring completions exist', () => {
    const before = service.getPatientJourneys().find((j) => j.id === 'pj-1')
    expect(before).toBeDefined()

    const result = service.cancelJourney('pj-1', 'Ångrad tilldelning', 'user-pal-1')
    expect(result).toEqual({ deleted: true })

    const after = service.getPatientJourneys().find((j) => j.id === 'pj-1')
    expect(after).toBeUndefined()
  })

  it('marks the journey COMPLETED and appends a CANCEL modification when form responses exist', () => {
    patchStore((s) => ({
      ...s,
      formResponses: [
        ...s.formResponses,
        {
          id: 'fr-cancel-test',
          patientId: 'p-1',
          caseId: 'case-1',
          templateId: 'qt-oss',
          answers: {},
          scores: {},
          submittedAt: new Date().toISOString(),
          patientJourneyId: 'pj-1',
        },
      ],
    }))

    const result = service.cancelJourney(
      'pj-1',
      'Patient avböjde fortsatt uppföljning',
      'user-pal-1',
    )
    expect(result.deleted).toBe(false)
    if (result.deleted) return

    expect(result.journey.status).toBe('COMPLETED')
    const mods = result.journey.modifications
    const cancelMod = mods[mods.length - 1]
    expect(cancelMod.type).toBe('CANCEL')
    expect(cancelMod.reason).toBe('Patient avböjde fortsatt uppföljning')
    expect(cancelMod.addedByUserId).toBe('user-pal-1')

    // Journey still exists in store
    const stored = service.getPatientJourneys().find((j) => j.id === 'pj-1')
    expect(stored?.status).toBe('COMPLETED')
  })

  it('marks the journey COMPLETED when recurringCompletions are present', () => {
    service.recordRecurringCompletion('pj-1', 'jte-std-1', 0, '2025-01-01')

    const result = service.cancelJourney('pj-1', 'Steg redan genomförda', 'user-pal-1')
    expect(result.deleted).toBe(false)
    if (result.deleted) return
    expect(result.journey.status).toBe('COMPLETED')
  })

  it('clears pausedAt when cancelling a suspended journey', () => {
    service.pauseJourney('pj-1')

    patchStore((s) => ({
      ...s,
      formResponses: [
        ...s.formResponses,
        {
          id: 'fr-cancel-suspended',
          patientId: 'p-1',
          caseId: 'case-1',
          templateId: 'qt-oss',
          answers: {},
          scores: {},
          submittedAt: new Date().toISOString(),
          patientJourneyId: 'pj-1',
        },
      ],
    }))

    const result = service.cancelJourney('pj-1', 'Avslutad under paus', 'user-pal-1')
    expect(result.deleted).toBe(false)
    if (result.deleted) return
    expect(result.journey.pausedAt).toBeNull()
    expect(result.journey.status).toBe('COMPLETED')
  })

  it('throws for an unknown journey id', () => {
    expect(() => service.cancelJourney('nonexistent', 'reason', 'user-pal-1')).toThrow()
  })
})
