import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initStore, resetStore } from '../api/storage'
import { SEED_STATE } from '../api/seed'
import * as service from '../api/service'
import { suggestWindowDays } from '../utils/journeyUtils'

// ---------------------------------------------------------------------------
// suggestWindowDays
// ---------------------------------------------------------------------------

describe('suggestWindowDays', () => {
  it('returns minimum 2 for very small offsets', () => {
    expect(suggestWindowDays(0)).toBe(2)
    expect(suggestWindowDays(5)).toBe(2)
    expect(suggestWindowDays(9)).toBe(2)
  })

  it('returns proportional window for common offsets', () => {
    expect(suggestWindowDays(14)).toBe(3) // week-2 form → ±3 days
    expect(suggestWindowDays(28)).toBe(6) // week-4 form → ±6 days
    expect(suggestWindowDays(58)).toBe(12) // ~2-month form → ±12 days
    expect(suggestWindowDays(90)).toBe(18) // 3-month form → ±18 days
  })

  it('caps at 30 for large offsets', () => {
    expect(suggestWindowDays(180)).toBe(30)
    expect(suggestWindowDays(365)).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// detectJourneyConflicts
// ---------------------------------------------------------------------------

describe('detectJourneyConflicts', () => {
  beforeEach(() => initStore(structuredClone(SEED_STATE)))
  afterEach(() => resetStore())

  /** Helper: create a fresh patient with no journeys */
  function freshPatient(displayName = 'Test Person') {
    return service.createPatient({ displayName, personalNumber: Math.random().toString(), dateOfBirth: '1980-01-01' })
  }

  it('returns empty when patient has no active journeys', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()

    const conflicts = service.detectJourneyConflicts(patient.id, template.id, '2026-03-01')
    expect(conflicts).toHaveLength(0)
  })

  it('detects overlap when two journeys schedule the same questionnaire within window', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()

    // Assign first journey on day 0
    const j1 = service.assignPatientJourney(patient.id, template.id, '2026-03-01')

    // The first questionnaire entry in the template
    const firstEntry = template.entries.find((e) => e.templateId)!
    // Assign second journey 2 days later — windows of ±windowDays around each
    // scheduledDate: if the two windows overlap at any calendar date, conflicts fire
    const conflicts = service.detectJourneyConflicts(patient.id, template.id, '2026-03-03')

    // With 2-day offset: journey1 window = [D-W, D+W], journey2 window = [D+2-W, D+2+W]
    // They overlap when 2 <= 2*windowDays, i.e. windowDays >= 1 (always true, seed min is 1)
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts[0].existingJourneyId).toBe(j1.id)
    expect(conflicts[0].newStep.templateId).toBe(conflicts[0].existingStep.templateId)
    expect(conflicts[0].overlapDays).toBeGreaterThanOrEqual(1)
    // First conflict must be for the first questionnaire entry
    expect(
      conflicts.some((c) => c.newStep.templateId === firstEntry.templateId),
    ).toBe(true)
  })

  it('returns no conflicts for same template with large start-date offset exceeding all windows', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()
    service.assignPatientJourney(patient.id, template.id, '2026-01-01')

    // Choose a start date far enough that no steps with the same questionnaire templateId
    // can overlap, even accounting for shared questionnaire IDs (e.g. qt-eq5d-oss used at
    // both day-180 and day-365 in the seed template).
    // Old journey: day-365 = Jan 1 2027, window ±14 = [Dec 18 2026, Jan 15 2027].
    // New journey starting Aug 20 2026: day-180 = Feb 17 2027, window [Feb 3, Mar 3] → no overlap.
    const conflicts = service.detectJourneyConflicts(patient.id, template.id, '2026-08-20')
    expect(conflicts).toHaveLength(0)
  })

  it('excludes COMPLETED journeys from conflict detection', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()

    // Assign and immediately complete the first journey
    const j1 = service.assignPatientJourney(patient.id, template.id, '2026-03-01')
    service.updatePatientJourneyStatus(j1.id, 'COMPLETED')

    // Second journey starting 2 days later — COMPLETED journey is excluded
    const conflicts = service.detectJourneyConflicts(patient.id, template.id, '2026-03-03')
    expect(conflicts).toHaveLength(0)
  })

  it('returns one conflict per new step even if two existing journeys overlap it', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()

    // Two existing journeys very close together
    service.assignPatientJourney(patient.id, template.id, '2026-03-01')
    service.assignPatientJourney(patient.id, template.id, '2026-03-02')

    // Third journey 1 day after second — should find exactly one conflict per new step
    const conflicts = service.detectJourneyConflicts(patient.id, template.id, '2026-03-03')
    // Verify no duplicate newStep.id in results
    const newStepIds = conflicts.map((c) => c.newStep.id)
    const uniqueIds = new Set(newStepIds)
    expect(newStepIds.length).toBe(uniqueIds.size)
  })
})

// ---------------------------------------------------------------------------
// assignPatientJourney with mergedStepIds
// ---------------------------------------------------------------------------

describe('assignPatientJourney mergedStepIds', () => {
  beforeEach(() => initStore(structuredClone(SEED_STATE)))
  afterEach(() => resetStore())

  function freshPatient() {
    return service.createPatient({ displayName: 'Test', personalNumber: Math.random().toString(), dateOfBirth: '1980-01-01' })
  }

  it('creates REMOVE_STEP modifications with mergedFromJourneyId for each merged step', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()
    const j1 = service.assignPatientJourney(patient.id, template.id, '2026-03-01')

    const stepToMerge = template.entries.find((e) => e.templateId)!

    const j2 = service.assignPatientJourney(
      patient.id,
      template.id,
      '2026-03-04',
      [],
      [{ stepId: stepToMerge.id, fromJourneyId: j1.id }],
    )

    const removeMods = j2.modifications.filter((m) => m.type === 'REMOVE_STEP')
    expect(removeMods).toHaveLength(1)
    expect(removeMods[0].stepId).toBe(stepToMerge.id)
    expect(removeMods[0].mergedFromJourneyId).toBe(j1.id)
  })

  it('merged step does not appear in getEffectiveSteps for the new journey', () => {
    const template = SEED_STATE.journeyTemplates.find((t) => t.entries.some((e) => e.templateId))!
    const patient = freshPatient()
    const j1 = service.assignPatientJourney(patient.id, template.id, '2026-03-01')

    const stepToMerge = template.entries.find((e) => e.templateId)!

    const j2 = service.assignPatientJourney(
      patient.id,
      template.id,
      '2026-03-04',
      [],
      [{ stepId: stepToMerge.id, fromJourneyId: j1.id }],
    )

    const j2Steps = service.getEffectiveSteps(j2.id)
    const j1Steps = service.getEffectiveSteps(j1.id)

    // j1 still has the step
    expect(j1Steps.some((s) => s.templateId === stepToMerge.templateId)).toBe(true)
    // j2 does NOT have it (was removed via modification)
    expect(j2Steps.some((s) => s.id === stepToMerge.id)).toBe(false)
  })

  it('creates journey with empty modifications when no mergedStepIds provided', () => {
    const template = SEED_STATE.journeyTemplates[0]
    const patient = freshPatient()

    const j = service.assignPatientJourney(patient.id, template.id, '2026-03-01')
    expect(j.modifications).toHaveLength(0)
  })
})
