import type {
  Instruction,
  JourneyModification,
  JourneyTemplateInstruction,
  PatientJourney,
} from '../schemas'
import { getStore, setStore } from '../storage'
import { computeTotalPauseShift, toScheduledDate } from './journeyDates'
import { now, uuid } from './utils'

export type CancelJourneyResult = { deleted: true } | { deleted: false; journey: PatientJourney }

/** Returns whole days between two ISO datetimes (or between datetime and now). */
function wholeElapsedDays(isoStart: string, isoEnd?: string): number {
  const endMs = isoEnd ? new Date(isoEnd).getTime() : Date.now()
  return Math.floor((endMs - new Date(isoStart).getTime()) / 86_400_000)
}

export function getPatientJourneys(patientId?: string): PatientJourney[] {
  const journeys = getStore().patientJourneys
  return patientId ? journeys.filter((j) => j.patientId === patientId) : journeys
}

export function assignPatientJourney(
  patientId: string,
  journeyTemplateId: string,
  startDate: string,
  researchModuleIds: string[] = [],
  mergedStepIds: { stepId: string; fromJourneyId: string }[] = [],
): PatientJourney {
  const state = getStore()

  // Convert merged step IDs into REMOVE_STEP modifications so the new
  // journey never shows forms that will be filled through a parallel journey.
  const mergeModifications: JourneyModification[] = mergedStepIds.map(
    ({ stepId, fromJourneyId }) => ({
      id: uuid(),
      type: 'REMOVE_STEP' as const,
      addedByUserId: 'system',
      addedAt: now(),
      reason:
        'Merged with existing journey — form will be collected through the earlier programme.',
      stepId,
      mergedFromJourneyId: fromJourneyId,
    }),
  )

  const journey: PatientJourney = {
    id: uuid(),
    patientId,
    journeyTemplateId,
    startDate,
    status: 'ACTIVE',
    researchModuleIds,
    modifications: mergeModifications,
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    createdAt: now(),
    updatedAt: now(),
  }

  const template = state.journeyTemplates.find((t) => t.id === journeyTemplateId)
  const instantiatedInstructions = instantiateInstructionsForJourney(
    journey,
    template?.instructions ?? [],
  )

  setStore({
    ...state,
    patientJourneys: [...state.patientJourneys, journey],
    instructions: [...(state.instructions ?? []), ...instantiatedInstructions],
  })
  return journey
}

export function updatePatientJourneyStatus(
  journeyId: string,
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED',
): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)
  const updated: PatientJourney = { ...journey, status, updatedAt: now() }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

/**
 * Freezes the journey timeline. The step scheduler will add `totalPausedDays +
 * daysSince(pausedAt)` to every step's offset so upcoming steps shift forward.
 */
export function pauseJourney(journeyId: string): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)
  if (journey.status !== 'ACTIVE') throw new Error(`Journey ${journeyId} is not active`)
  const updated: PatientJourney = {
    ...journey,
    status: 'SUSPENDED',
    pausedAt: now(),
    updatedAt: now(),
  }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

/**
 * Resumes a suspended journey. Accumulates the elapsed pause duration into
 * `totalPausedDays` so all step dates remain permanently shifted forward
 * by the total time paused.
 */
export function resumeJourney(journeyId: string): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)
  if (journey.status !== 'SUSPENDED') throw new Error(`Journey ${journeyId} is not suspended`)
  const additionalDays = journey.pausedAt ? wholeElapsedDays(journey.pausedAt) : 0
  const updated: PatientJourney = {
    ...journey,
    status: 'ACTIVE',
    pausedAt: null,
    totalPausedDays: (journey.totalPausedDays ?? 0) + additionalDays,
    updatedAt: now(),
  }

  const shift = computeTotalPauseShift(updated)
  const startMs = new Date(updated.startDate).getTime()
  const updatedInstructions = (state.instructions ?? []).map((ins) => {
    if (ins.patientJourneyId !== journeyId) return ins
    const startAt = toScheduledDate(startMs, ins.startDayOffset, shift)
    const endAt =
      ins.endDayOffset === undefined ? null : toScheduledDate(startMs, ins.endDayOffset, shift)
    return {
      ...ins,
      startAt: `${startAt}T00:00:00.000Z`,
      endAt: endAt ? `${endAt}T00:00:00.000Z` : null,
      updatedAt: now(),
    }
  })

  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
    instructions: updatedInstructions,
  })
  return updated
}

export function modifyPatientJourney(
  journeyId: string,
  modification: Omit<JourneyModification, 'id' | 'addedAt'>,
): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)

  const mod: JourneyModification = { ...modification, id: uuid(), addedAt: now() }
  let updated: PatientJourney = {
    ...journey,
    modifications: [...journey.modifications, mod],
    updatedAt: now(),
  }
  if (modification.type === 'SWITCH_TEMPLATE' && modification.newTemplateId)
    updated = { ...updated, journeyTemplateId: modification.newTemplateId }

  // Allow re-anchoring the start date when switching templates (e.g. surgery happened)
  if (modification.type === 'SWITCH_TEMPLATE' && modification.newStartDate)
    updated = { ...updated, startDate: modification.newStartDate }

  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

export function enrollResearchModule(journeyId: string, moduleId: string): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)
  if (journey.researchModuleIds.includes(moduleId)) return journey
  const updated: PatientJourney = {
    ...journey,
    researchModuleIds: [...journey.researchModuleIds, moduleId],
    updatedAt: now(),
  }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

export function unenrollResearchModule(journeyId: string, moduleId: string): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)
  const updated: PatientJourney = {
    ...journey,
    researchModuleIds: journey.researchModuleIds.filter((id) => id !== moduleId),
    updatedAt: now(),
  }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

/**
 * Records that a specific occurrence of a recurring step has been completed.
 * Called automatically from submitFormResponse when the form is linked to a
 * recurring journey step (recurrenceIntervalDays is set on the template entry).
 *
 * Idempotent: calling it twice for the same stepId + occurrenceIndex is a no-op.
 */
/**
 * Cancels a patient journey.
 * - No recorded data (no form responses, no recurringCompletions) → journey is deleted entirely.
 * - Has data → journey is marked COMPLETED with a CANCEL modification so history is preserved.
 */
export function cancelJourney(
  journeyId: string,
  reason: string,
  userId: string,
): CancelJourneyResult {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)

  const hasData =
    state.formResponses.some((r) => r.patientJourneyId === journeyId) ||
    (journey.recurringCompletions?.length ?? 0) > 0

  if (!hasData) {
    setStore({ ...state, patientJourneys: state.patientJourneys.filter((j) => j.id !== journeyId) })
    return { deleted: true }
  }

  const mod: JourneyModification = {
    id: uuid(),
    type: 'CANCEL',
    addedByUserId: userId,
    addedAt: now(),
    reason,
  }
  const updated: PatientJourney = {
    ...journey,
    status: 'COMPLETED',
    pausedAt: null,
    modifications: [...journey.modifications, mod],
    updatedAt: now(),
  }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return { deleted: false, journey: updated }
}

export function recordRecurringCompletion(
  journeyId: string,
  stepId: string,
  occurrenceIndex: number,
  completedAt: string, // YYYY-MM-DD
): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)

  const alreadyRecorded = (journey.recurringCompletions ?? []).some(
    (c) => c.stepId === stepId && c.occurrenceIndex === occurrenceIndex,
  )
  if (alreadyRecorded) return journey

  const updated: PatientJourney = {
    ...journey,
    recurringCompletions: [
      ...(journey.recurringCompletions ?? []),
      { stepId, occurrenceIndex, completedAt },
    ],
    updatedAt: now(),
  }
  setStore({
    ...state,
    patientJourneys: state.patientJourneys.map((j) => (j.id === journeyId ? updated : j)),
  })
  return updated
}

function instantiateInstructionsForJourney(
  journey: PatientJourney,
  templateInstructions: JourneyTemplateInstruction[],
): Instruction[] {
  const shift = computeTotalPauseShift(journey)
  const startMs = new Date(journey.startDate).getTime()

  return templateInstructions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ti) => {
      const startAt = toScheduledDate(startMs, ti.startDayOffset, shift)
      const endAt =
        ti.endDayOffset === undefined ? null : toScheduledDate(startMs, ti.endDayOffset, shift)
      return {
        id: uuid(),
        patientJourneyId: journey.id,
        journeyTemplateInstructionId: ti.id,
        instructionTemplateId: ti.instructionTemplateId,
        label: ti.label,
        startDayOffset: ti.startDayOffset,
        endDayOffset: ti.endDayOffset,
        startAt: `${startAt}T00:00:00.000Z`,
        endAt: endAt ? `${endAt}T00:00:00.000Z` : null,
        status: 'ACTIVE',
        tags: ti.tags,
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        completedAt: null,
        completedByUserId: null,
        createdAt: now(),
        updatedAt: now(),
      }
    })
}
