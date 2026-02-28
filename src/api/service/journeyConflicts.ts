import { getStore } from '../storage'
import { getEffectiveSteps, getEffectiveStepsForTemplate } from './journeyResolver'
import type { EffectiveStep } from './journeyResolver'

/**
 * A detected scheduling overlap between a step in an existing patient journey
 * and the corresponding step in a prospective new journey.
 */
export type JourneyStepConflict = {
  /** ID of the existing journey whose step overlaps. */
  existingJourneyId: string
  /** The resolved step from the existing journey. */
  existingStep: EffectiveStep
  /**
   * The prospective step (from the new template + startDate, not yet stored).
   * Its `id` is the raw JourneyTemplateEntry id \u2014 use this when building
   * mergedStepIds for assignPatientJourney.
   */
  newStep: EffectiveStep
  /** Number of calendar days that the two windows overlap (always \u2265 1). */
  overlapDays: number
}

function shiftDate(ymd: string, days: number): string {
  return new Date(new Date(ymd).getTime() + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Detects which steps in a prospective new journey would overlap (same
 * questionnaire template, intersecting due windows) with steps already
 * scheduled in the patient\u2019s existing active/suspended journeys.
 *
 * Results are sorted by the new step\u2019s offsetDays so they appear in
 * chronological order in the UI.
 *
 * Call this before creating a new journey to give the clinician the
 * opportunity to remove duplicate steps from the new programme.
 */
export function detectJourneyConflicts(
  patientId: string,
  newTemplateId: string,
  newStartDate: string,
): JourneyStepConflict[] {
  const state = getStore()
  const existingJourneys = state.patientJourneys.filter(
    (j) => j.patientId === patientId && (j.status === 'ACTIVE' || j.status === 'SUSPENDED'),
  )
  if (existingJourneys.length === 0) return []

  const newSteps = getEffectiveStepsForTemplate(newTemplateId, newStartDate)

  // Build a lookup of existing steps keyed by templateId for O(n) matching.
  const existingByTemplateId = new Map<
    string,
    { journeyId: string; step: EffectiveStep }[]
  >()
  for (const journey of existingJourneys) {
    for (const step of getEffectiveSteps(journey.id)) {
      if (!step.templateId) continue
      const bucket = existingByTemplateId.get(step.templateId) ?? []
      bucket.push({ journeyId: journey.id, step })
      existingByTemplateId.set(step.templateId, bucket)
    }
  }

  // Deduplicate by newStep.id so we emit at most one conflict per new step.
  const seen = new Set<string>()
  const conflicts: JourneyStepConflict[] = []

  for (const newStep of newSteps) {
    if (!newStep.templateId) continue
    if (seen.has(newStep.id)) continue

    const candidates = existingByTemplateId.get(newStep.templateId) ?? []
    for (const { journeyId, step: existingStep } of candidates) {
      const existStart = shiftDate(existingStep.scheduledDate, -existingStep.windowDays)
      const existEnd = shiftDate(existingStep.scheduledDate, existingStep.windowDays)
      const newStart = shiftDate(newStep.scheduledDate, -newStep.windowDays)
      const newEnd = shiftDate(newStep.scheduledDate, newStep.windowDays)

      if (newEnd < existStart || newStart > existEnd) continue

      const overlapStart = existStart > newStart ? existStart : newStart
      const overlapEnd = existEnd < newEnd ? existEnd : newEnd
      const overlapDays = Math.max(
        0,
        Math.round(
          (new Date(overlapEnd).getTime() - new Date(overlapStart).getTime()) / 86_400_000,
        ) + 1,
      )

      if (overlapDays > 0) {
        seen.add(newStep.id)
        conflicts.push({ existingJourneyId: journeyId, existingStep, newStep, overlapDays })
        break // one conflict per new step is enough for the UI
      }
    }
  }

  return conflicts.sort((a, b) => a.newStep.offsetDays - b.newStep.offsetDays)
}
