import type { JourneyModification, PatientJourney, PatientJourneyStatus } from '../schemas'
import type {
  CancelJourneyResult,
  EffectiveStep,
  JourneyStepConflict,
  MergedDueStep,
} from '../service'
import * as service from '../service'
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
  mergedStepIds?: { stepId: string; fromJourneyId: string }[],
): Promise<PatientJourney> =>
  withDelay(() =>
    service.assignPatientJourney(
      patientId,
      journeyTemplateId,
      startDate,
      researchModuleIds,
      mergedStepIds,
    ),
  )

export const updatePatientJourneyStatus = (
  journeyId: string,
  status: PatientJourneyStatus,
): Promise<PatientJourney> => withDelay(() => service.updatePatientJourneyStatus(journeyId, status))

export const pauseJourney = (journeyId: string): Promise<PatientJourney> =>
  withDelay(() => service.pauseJourney(journeyId))

export const resumeJourney = (journeyId: string): Promise<PatientJourney> =>
  withDelay(() => service.resumeJourney(journeyId))

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

/**
 * Returns questionnaire steps due for a patient on the given date (YYYY-MM-DD),
 * merged across all their parallel journeys so each form template appears at most once.
 */
export const getMergedDueStepsForPatient = (
  patientId: string,
  date: string,
): Promise<MergedDueStep[]> => withDelay(() => service.getMergedDueStepsForPatient(patientId, date))

/**
 * Detects which steps in a prospective new journey would overlap (same
 * questionnaire, intersecting due windows) with the patient’s existing journeys.
 * Call before assignPatientJourney to offer the clinician conflict resolution.
 */
export const detectJourneyConflicts = (
  patientId: string,
  templateId: string,
  startDate: string,
): Promise<JourneyStepConflict[]> =>
  withDelay(() => service.detectJourneyConflicts(patientId, templateId, startDate))

export const cancelJourney = (
  journeyId: string,
  reason: string,
  userId: string,
): Promise<CancelJourneyResult> => withDelay(() => service.cancelJourney(journeyId, reason, userId))
