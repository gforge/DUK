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
    createdAt: now(),
    updatedAt: now(),
  }
  setStore({ ...state, patientJourneys: [...state.patientJourneys, journey] })
  return journey
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
