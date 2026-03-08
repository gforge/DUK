import type { Consent } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getResearchConsents = (patientId?: string, moduleId?: string): Promise<Consent[]> =>
  withDelay(() => service.getResearchConsents(patientId, moduleId))

export const grantConsent = (
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
  grantedByUserId: string,
): Promise<Consent> =>
  withDelay(() =>
    service.grantConsent(patientId, researchModuleId, patientJourneyId, grantedByUserId),
  )

export const revokeConsent = (
  consentId: string,
  revokedByUserId: string,
  reason?: string,
): Promise<Consent> => withDelay(() => service.revokeConsent(consentId, revokedByUserId, reason))

export const declineConsent = (
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
  userId: string,
  reason?: string,
): Promise<Consent> =>
  withDelay(() =>
    service.declineConsent(patientId, researchModuleId, patientJourneyId, userId, reason),
  )

export const hasActiveConsent = (
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
): Promise<boolean> =>
  withDelay(() => service.hasActiveConsent(patientId, researchModuleId, patientJourneyId))

export const getActiveConsent = (
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
): Promise<Consent | undefined> =>
  withDelay(() => service.getActiveConsent(patientId, researchModuleId, patientJourneyId))
