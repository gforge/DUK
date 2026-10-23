/**
 * Patient without a digital channel (no e-ID or app).
 *
 * Forms are never sent to her; every checkpoint in the journey instead becomes a
 * case that staff handle by phone or by booking a visit. The case carries the
 * NO_DIGITAL_CHANNEL signal so the queue shows why there is no form response.
 *
 * | Patient | Case    | Status       | Pathway                                   |
 * | ------- | ------- | ------------ | ----------------------------------------- |
 * | p-42    | case-44 | NEEDS_REVIEW | 2-week checkpoint, staff call the patient |
 */
import type { AuditEvent, Case, EpisodeOfCare, Patient, PatientJourney } from '../schemas'
import { daysAgo, iso, isoDate } from './shared'

export const nonDigitalPatients: Patient[] = [
  {
    id: 'p-42',
    displayName: 'Gunhild Lindgren',
    personalNumber: '193806124567',
    dateOfBirth: '1938-06-12',
    phone: '070-211 49 31',
    palId: 'user-doc-1',
    noDigitalChannel: true,
    createdAt: iso(daysAgo(12)),
  },
]

export const nonDigitalEpisodes: EpisodeOfCare[] = [
  {
    id: 'ep-42',
    patientId: 'p-42',
    label: 'Standard fracture follow-up',
    clinicalArea: 'Ortopedi',
    status: 'OPEN',
    openedAt: iso(daysAgo(12)),
    closedAt: null,
    responsibleUserId: 'user-doc-1',
    primaryCaseId: 'case-44',
    createdAt: iso(daysAgo(12)),
    updatedAt: iso(daysAgo(12)),
  },
]

export const nonDigitalJourneys: PatientJourney[] = [
  {
    id: 'pj-42',
    episodeId: 'ep-42',
    patientId: 'p-42',
    journeyTemplateId: 'jt-standard',
    phaseType: 'FOLLOWUP',
    joinedAt: '',
    startDate: isoDate(daysAgo(12)),
    status: 'ACTIVE',
    researchModuleIds: [],
    modifications: [],
    recurringCompletions: [],
    pausedAt: null,
    totalPausedDays: 0,
    createdAt: iso(daysAgo(12)),
    updatedAt: iso(daysAgo(12)),
  },
]

export const nonDigitalCases: Case[] = [
  {
    id: 'case-44',
    patientId: 'p-42',
    episodeId: 'ep-42',
    category: 'ACUTE',
    status: 'NEEDS_REVIEW',
    triggers: ['NO_DIGITAL_CHANNEL'],
    policyWarnings: [],
    internalNote:
      'Handledsfraktur, gipsbehandlad. Patienten saknar e-legitimation och app: 2-veckorskontrollen sköts per telefon av personal. Fråga om smärta, svullnad och känsel i fingrarna.',
    createdByUserId: 'user-nurse-1',
    scheduledAt: iso(daysAgo(1)),
    lastActivityAt: iso(daysAgo(1)),
    createdAt: iso(daysAgo(12)),
    colleagueReviews: [],
    reviews: [],
  },
]

export const nonDigitalAuditEvents: AuditEvent[] = [
  {
    id: 'ae-nd-1',
    caseId: 'case-44',
    userId: 'user-nurse-1',
    userRole: 'NURSE',
    action: 'CASE_CREATED',
    timestamp: iso(daysAgo(12)),
  },
  {
    id: 'ae-nd-2',
    caseId: 'case-44',
    userId: 'user-nurse-1',
    userRole: 'NURSE',
    action: 'STATUS_CHANGED',
    details: { from: 'NEW', to: 'NEEDS_REVIEW', reason: 'NO_DIGITAL_CHANNEL' },
    timestamp: iso(daysAgo(1)),
  },
]
