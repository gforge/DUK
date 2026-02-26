import { getStore, setStore } from '../storage'
import { uuid, now } from './utils'
import type { PatientJourney, JourneyModification } from '../schemas'

export function getPatientJourneys(patientId?: string): PatientJourney[] {
  const journeys = getStore().patientJourneys
  return patientId ? journeys.filter((j) => j.patientId === patientId) : journeys
}

export function assignPatientJourney(
  patientId: string,
  journeyTemplateId: string,
  startDate: string,
  researchModuleIds: string[] = [],
): PatientJourney {
  const state = getStore()
  const journey: PatientJourney = {
    id: uuid(),
    patientId,
    journeyTemplateId,
    startDate,
    status: 'ACTIVE',
    researchModuleIds,
    modifications: [],
    recurringCompletions: [],
    createdAt: now(),
    updatedAt: now(),
  }
  setStore({ ...state, patientJourneys: [...state.patientJourneys, journey] })
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
