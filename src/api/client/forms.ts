import type { Case, FormResponse } from '../schemas'
import * as service from '../service'
import type { JourneyStepContext } from '../service/forms'
import { withDelay } from './delay'

export const getFormResponses = (caseId: string): Promise<FormResponse[]> =>
  withDelay(() => service.getFormResponses(caseId))

export const getFormResponsesByJourney = (journeyId: string): Promise<FormResponse[]> =>
  withDelay(() => service.getFormResponsesByJourney(journeyId))

export const submitFormResponse = (
  patientId: string,
  caseId: string,
  templateId: string,
  answers: Record<string, string | number | boolean>,
  journeyContext?: JourneyStepContext,
): Promise<FormResponse> =>
  withDelay(() =>
    service.submitFormResponse(patientId, caseId, templateId, answers, journeyContext),
  )

export const seekContact = (patientId: string, caseId: string): Promise<Case> =>
  withDelay(() => service.seekContact(patientId, caseId))
