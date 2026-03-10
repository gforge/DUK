import type {
  Instruction,
  JourneyModification,
  JourneyTemplateEntry,
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

/**
 * Builds REMOVE_STEP modifications for template entries whose window closed before
 * the patient's joinedAt date. Allows late-registered patients to skip steps
 * that were already past their due window at the time of registration.
 */
function buildLateJoinModifications(
  entries: JourneyTemplateEntry[],
  startDate: string,
  joinedAt: string,
): JourneyModification[] {
  const elapsedDays = Math.floor(
    (new Date(joinedAt).getTime() - new Date(startDate).getTime()) / 86_400_000,
  )
  return entries
    .filter((e) => e.offsetDays + (e.windowDays ?? 2) < elapsedDays)
    .map((e) => ({
      id: uuid(),
      type: 'REMOVE_STEP' as const,
      addedByUserId: 'system',
      addedAt: now(),
      reason: 'Inskrivning efter stegets fönster — patienten registrerades sent.',
      stepId: e.id,
    }))
}

export function getPatientJourneys(patientId?: string): PatientJourney[] {
  const journeys = getStore().patientJourneys
  return patientId ? journeys.filter((j) => j.patientId === patientId) : journeys
}

export function assignPatientJourney(
  patientId: string,
  journeyTemplateId: string,
  startDate: string,
  episodeId: string = '',
  researchModuleIds: string[] = [],
  mergedStepIds: { stepId: string; fromJourneyId: string }[] = [],
  joinedAt: string = '',
  responsiblePhysicianUserId?: string,
): PatientJourney {
  const state = getStore()
  const template = state.journeyTemplates.find((t) => t.id === journeyTemplateId)
  const episode = episodeId ? state.episodesOfCare.find((e) => e.id === episodeId) : undefined
  const patient = state.patients.find((p) => p.id === patientId)
  const resolvedResponsiblePhysicianUserId =
    responsiblePhysicianUserId ?? episode?.responsibleUserId ?? patient?.palId

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

  // Auto-remove steps whose window closed before the patient enrolled (late join).
  const lateJoinModifications: JourneyModification[] =
    joinedAt && joinedAt > startDate
      ? buildLateJoinModifications(template?.entries ?? [], startDate, joinedAt)
      : []

  const journey: PatientJourney = {
    id: uuid(),
    episodeId,
    patientId,
    journeyTemplateId,
    phaseType: 'FOLLOWUP',
    responsiblePhysicianUserId: resolvedResponsiblePhysicianUserId,
    joinedAt,
    startDate,
    status: 'ACTIVE',
    researchModuleIds,
    modifications: [...mergeModifications, ...lateJoinModifications],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    createdAt: now(),
    updatedAt: now(),
  }

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
  const updated: PatientJourney = {
    ...journey,
    modifications: [...journey.modifications, mod],
    updatedAt: now(),
  }

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

export function updateJourneyResponsiblePhysicianUser(
  journeyId: string,
  responsiblePhysicianUserId?: string | null,
): PatientJourney {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === journeyId)
  if (!journey) throw new Error(`Journey ${journeyId} not found`)

  const updated: PatientJourney = {
    ...journey,
    responsiblePhysicianUserId,
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
  // Days elapsed between startDate and joinedAt — used to auto-cancel past instructions.
  const elapsedDays =
    journey.joinedAt && journey.joinedAt > journey.startDate
      ? Math.floor((new Date(journey.joinedAt).getTime() - startMs) / 86_400_000)
      : 0

  return templateInstructions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ti) => {
      // A late-joined instruction has a defined end that already passed before enrollment.
      const isLateJoin =
        elapsedDays > 0 && ti.endDayOffset !== undefined && ti.endDayOffset < elapsedDays
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
        status: isLateJoin ? ('CANCELLED' as const) : ('ACTIVE' as const),
        cancelReason: isLateJoin ? ('LATE_JOIN' as const) : undefined,
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

/**
 * Starts the next phase of an episode by completing the current journey and
 * creating a new PatientJourney linked to the same episode.
 *
 * - `fromJourneyId`: the currently-active journey being superseded.
 * - `journeyTemplateId`: template for the new phase.
 * - `startDate`: clinical anchor date for the new phase (YYYY-MM-DD).
 * - `phaseType`: semantic role of the new phase.
 * - `trigger.type`: what clinical event triggered the transition.
 * - `trigger.triggeredByUserId`: who initiated the transition.
 * - `trigger.note`: optional free-text note.
 */
export function startNextPhase(params: {
  fromJourneyId: string
  journeyTemplateId: string
  startDate: string
  phaseType: import('../schemas').PhaseType
  trigger: {
    type: import('../schemas').TransitionTriggerType
    triggeredByUserId?: string
    note?: string
  }
  researchModuleIds?: string[]
  responsiblePhysicianUserId?: string
}): PatientJourney {
  const state = getStore()
  const fromJourney = state.patientJourneys.find((j) => j.id === params.fromJourneyId)
  if (!fromJourney) throw new Error(`Journey ${params.fromJourneyId} not found`)
  if (!fromJourney.episodeId) throw new Error(`Journey ${params.fromJourneyId} has no episodeId`)

  // Mark the previous phase as COMPLETED
  const completedPrev: PatientJourney = {
    ...fromJourney,
    status: 'COMPLETED',
    updatedAt: now(),
  }

  const template = state.journeyTemplates.find((t) => t.id === params.journeyTemplateId)

  const newJourney: PatientJourney = {
    id: uuid(),
    episodeId: fromJourney.episodeId,
    patientId: fromJourney.patientId,
    journeyTemplateId: params.journeyTemplateId,
    phaseType: params.phaseType,
    responsiblePhysicianUserId:
      params.responsiblePhysicianUserId ?? fromJourney.responsiblePhysicianUserId,
    joinedAt: '',
    startDate: params.startDate,
    status: 'ACTIVE',
    researchModuleIds: params.researchModuleIds ?? [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    transition: {
      fromJourneyId: params.fromJourneyId,
      type: params.trigger.type,
      triggeredAt: now(),
      triggeredByUserId: params.trigger.triggeredByUserId,
      note: params.trigger.note,
    },
    createdAt: now(),
    updatedAt: now(),
  }

  const newInstructions = instantiateInstructionsForJourney(
    newJourney,
    template?.instructions ?? [],
  )

  setStore({
    ...state,
    patientJourneys: [
      ...state.patientJourneys.map((j) => (j.id === params.fromJourneyId ? completedPrev : j)),
      newJourney,
    ],
    instructions: [...(state.instructions ?? []), ...newInstructions],
  })

  return newJourney
}
