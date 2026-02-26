import * as service from '../service'
import type { PatientJourney, JourneyModification, PatientJourneyStatus } from '../schemas'
import type { EffectiveStep } from '../service'
import { withDelay } from './delay'

export const getPatientJourneys = (patientId?: string): Promise<PatientJourney[]> =>
  withDelay(() => service.getPatientJourneys(patientId))

export const getEffectiveSteps = (journeyId: string): Promise<EffectiveStep[]> =>
  withDelay(() => service.getEffectiveSteps(journeyId))

export const assignPatientJourney = (
  patientId: string,
  journeyTemplateId: string,
  startDate: string,
  researchModuleIds?: string[],
): Promise<PatientJourney> =>
  withDelay(() =>
    service.assignPatientJourney(patientId, journeyTemplateId, startDate, researchModuleIds),
  )

export const updatePatientJourneyStatus = (
  journeyId: string,
  status: PatientJourneyStatus,
): Promise<PatientJourney> => withDelay(() => service.updatePatientJourneyStatus(journeyId, status))

export const modifyPatientJourney = (
  journeyId: string,
  modification: Omit<JourneyModification, 'id' | 'addedAt'>,
): Promise<PatientJourney> => withDelay(() => service.modifyPatientJourney(journeyId, modification))

export const enrollResearchModule = (
  journeyId: string,
  moduleId: string,
): Promise<PatientJourney> => withDelay(() => service.enrollResearchModule(journeyId, moduleId))

export const unenrollResearchModule = (
  journeyId: string,
  moduleId: string,
): Promise<PatientJourney> => withDelay(() => service.unenrollResearchModule(journeyId, moduleId))

/**
 * Records one completed occurrence of a recurring step.
 * Normally called automatically by submitFormResponse when journeyContext is provided.
 * Can also be called directly for manual overrides.
 */
export const recordRecurringCompletion = (
  journeyId: string,
  stepId: string,
  occurrenceIndex: number,
  completedAt: string,
): Promise<PatientJourney> =>
  withDelay(() =>
    service.recordRecurringCompletion(journeyId, stepId, occurrenceIndex, completedAt),
  )
