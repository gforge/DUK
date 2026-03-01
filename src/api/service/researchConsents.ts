import { getStore, setStore } from '../storage'
import { uuid, now } from './utils'
import type { Consent } from '../schemas'

export function getResearchConsents(patientId?: string, moduleId?: string): Consent[] {
  const consents = getStore().researchConsents
  return consents.filter(
    (c) =>
      (patientId === undefined || c.patientId === patientId) &&
      (moduleId === undefined || c.researchModuleId === moduleId),
  )
}

/**
 * Records a patient's informed consent to a research module for a specific journey.
 * Idempotent: returns the existing active consent if one already exists.
 */
export function grantConsent(
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
  grantedByUserId: string,
): Consent {
  const state = getStore()
  const existing = state.researchConsents.find(
    (c) =>
      c.patientId === patientId &&
      c.researchModuleId === researchModuleId &&
      c.patientJourneyId === patientJourneyId &&
      c.revokedAt === null,
  )
  if (existing) return existing

  const consent: Consent = {
    id: uuid(),
    patientId,
    researchModuleId,
    patientJourneyId,
    grantedAt: now(),
    grantedByUserId,
    revokedAt: null,
    revokedByUserId: null,
    withdrawalReason: null,
  }
  setStore({ ...state, researchConsents: [...state.researchConsents, consent] })
  return consent
}

/**
 * Revokes an existing consent. The consent record is retained for audit purposes
 * with `revokedAt` and `revokedByUserId` set. An optional `reason` is stored in
 * `withdrawalReason` to satisfy GCP ICH E6 audit-trail requirements.
 */
export function revokeConsent(
  consentId: string,
  revokedByUserId: string,
  reason?: string,
): Consent {
  const state = getStore()
  const consent = state.researchConsents.find((c) => c.id === consentId)
  if (!consent) throw new Error(`Consent ${consentId} not found`)
  const updated: Consent = {
    ...consent,
    revokedAt: now(),
    revokedByUserId,
    withdrawalReason: reason ?? consent.withdrawalReason,
  }
  setStore({
    ...state,
    researchConsents: state.researchConsents.map((c) => (c.id === consentId ? updated : c)),
  })
  return updated
}

/**
 * Returns true if the patient has a non-revoked consent for the given module and journey.
 */
export function hasActiveConsent(
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
): boolean {
  return getStore().researchConsents.some(
    (c) =>
      c.patientId === patientId &&
      c.researchModuleId === researchModuleId &&
      c.patientJourneyId === patientJourneyId &&
      c.revokedAt === null,
  )
}

/**
 * Returns the active (non-revoked) consent for a patient+module+journey, or undefined.
 */
export function getActiveConsent(
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
): Consent | undefined {
  return getStore().researchConsents.find(
    (c) =>
      c.patientId === patientId &&
      c.researchModuleId === researchModuleId &&
      c.patientJourneyId === patientJourneyId &&
      c.revokedAt === null,
  )
}

/**
 * Records a patient's explicit decision NOT to participate in a research module.
 *
 * GCP ICH E6 compliance: every consent decision — including a decline — must be
 * captured in a durable, auditable record. If the patient has an existing active
 * consent (e.g. re-approached after prior grant), that consent is revoked instead
 * of creating a duplicate record. Otherwise a new consent record is created with
 * `revokedAt` set to the same timestamp as `grantedAt`, unambiguously marking it
 * as a decline rather than a post-consent withdrawal.
 *
 * The optional `reason` is stored in `withdrawalReason`.
 */
export function declineConsent(
  patientId: string,
  researchModuleId: string,
  patientJourneyId: string,
  userId: string,
  reason?: string,
): Consent {
  const state = getStore()
  const existing = state.researchConsents.find(
    (c) =>
      c.patientId === patientId &&
      c.researchModuleId === researchModuleId &&
      c.patientJourneyId === patientJourneyId &&
      c.revokedAt === null,
  )
  if (existing) {
    return revokeConsent(existing.id, userId, reason)
  }
  const ts = now()
  const consent: Consent = {
    id: uuid(),
    patientId,
    researchModuleId,
    patientJourneyId,
    grantedAt: ts,
    grantedByUserId: userId,
    revokedAt: ts, // same timestamp = explicit decline, not a post-consent withdrawal
    revokedByUserId: userId,
    withdrawalReason: reason ?? null,
  }
  setStore({ ...state, researchConsents: [...state.researchConsents, consent] })
  return consent
}
