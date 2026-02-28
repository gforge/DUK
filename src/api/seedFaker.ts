/**
 * Faker seed — ~1 000 patients, using @faker-js/faker with a fixed seed for
 * reproducibility. Lazily imported (dynamic import) to keep the main bundle
 * unaffected; only downloaded when the user requests the large seed.
 */

import type { AppState, Case, Patient, PatientJourney, AuditEvent } from './schemas'
import { SEED_STATE } from './seed'
import {
  TRIGGERS,
  PAL_IDS,
  isoDateOffset as isoDate,
  isoTsOffset as isoTs,
} from './seed/seedHelpers'
import type { Cohort } from './seed/seedHelpers'

// Placement cohorts — same shape as seedRealistic, scaled up

const COHORTS: Cohort[] = [
  // ACUTE — Day 1–2
  { startDaysAgo: 1, count: 15, triggerProb: 0.4, complexProb: 0.2 },
  { startDaysAgo: 2, count: 15, triggerProb: 0.35, complexProb: 0.2 },
  // ACUTE — Day 10–14
  { startDaysAgo: 10, count: 15, triggerProb: 0.3, complexProb: 0.15 },
  { startDaysAgo: 12, count: 15, triggerProb: 0.25, complexProb: 0.1 },
  // SUBACUTE — Week 4
  { startDaysAgo: 28, count: 20, triggerProb: 0.2, complexProb: 0.1 },
  { startDaysAgo: 30, count: 20, triggerProb: 0.15, complexProb: 0.08 },
  // SUBACUTE — Week 6–8
  { startDaysAgo: 48, count: 20, triggerProb: 0.2, complexProb: 0.1 },
  { startDaysAgo: 54, count: 20, triggerProb: 0.15, complexProb: 0.08 },
  // Between phases
  { startDaysAgo: 70, count: 30, triggerProb: 0.1, complexProb: 0.05 },
  { startDaysAgo: 100, count: 30, triggerProb: 0.05, complexProb: 0.05 },
  { startDaysAgo: 140, count: 30, triggerProb: 0.08, complexProb: 0.05 },
  { startDaysAgo: 230, count: 40, triggerProb: 0.04, complexProb: 0.02 },
  // CONTROL — 6 months
  { startDaysAgo: 168, count: 75, triggerProb: 0.08, complexProb: 0.05 },
  { startDaysAgo: 180, count: 75, triggerProb: 0.05, complexProb: 0.03 },
  { startDaysAgo: 192, count: 75, triggerProb: 0.06, complexProb: 0.04 },
  // CONTROL — 1 year
  { startDaysAgo: 355, count: 75, triggerProb: 0.06, complexProb: 0.03 },
  { startDaysAgo: 365, count: 75, triggerProb: 0.04, complexProb: 0.02 },
  { startDaysAgo: 375, count: 75, triggerProb: 0.05, complexProb: 0.02 },
]

export async function buildFakerSeed(): Promise<AppState> {
  const { faker } = await import('@faker-js/faker')
  faker.seed(42)

  const patients: Patient[] = []
  const cases: Case[] = []
  const journeys: PatientJourney[] = []
  const auditEvents: AuditEvent[] = []

  let idx = 0

  for (const cohort of COHORTS) {
    for (let c = 0; c < cohort.count; c++, idx++) {
      const pid = `fp-${idx}`
      const caseId = `fc-${idx}`
      const jid = `fj-${idx}`

      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const displayName = `${firstName} ${lastName}`
      const birthDate = faker.date.birthdate({ min: 1940, max: 1985, mode: 'year' })
      const birthYear = birthDate.getFullYear()
      const birthMonth = String(birthDate.getMonth() + 1).padStart(2, '0')
      const birthDay = String(birthDate.getDate()).padStart(2, '0')
      const sequenceNum = String(1000 + idx).padStart(4, '0')

      const palId = PAL_IDS[idx % PAL_IDS.length]
      const hasTriggers = faker.datatype.boolean({ probability: cohort.triggerProb })
      const triggers = hasTriggers
        ? [TRIGGERS[faker.number.int({ min: 0, max: TRIGGERS.length - 1 })]]
        : []
      const isComplex = faker.datatype.boolean({ probability: cohort.complexProb })
      const journeyTemplateId = isComplex ? 'jt-complex' : 'jt-standard'

      const status =
        triggers.length > 0
          ? 'NEEDS_REVIEW'
          : faker.helpers.arrayElement(['NEW', 'TRIAGED', 'FOLLOWING_UP'])

      const startDate = isoDate(-cohort.startDaysAgo)
      const createdAt = isoTs(-cohort.startDaysAgo)

      patients.push({
        id: pid,
        displayName,
        personalNumber: `${birthYear}${birthMonth}${birthDay}${sequenceNum}`,
        dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
        palId,
        lastOpenedAt:
          triggers.length > 0
            ? isoTs(-faker.number.int({ min: 1, max: 7 }))
            : isoTs(-faker.number.int({ min: 1, max: 30 })),
        createdAt,
      })

      cases.push({
        id: caseId,
        patientId: pid,
        category: 'CONTROL', // static fallback; dashboard derives category via journey
        status: status as Case['status'],
        triggers: triggers as Case['triggers'],
        policyWarnings: [],
        createdByUserId: palId,
        createdAt,
        scheduledAt: createdAt,
        lastActivityAt: isoTs(-faker.number.int({ min: 0, max: 5 })),
      })

      journeys.push({
        id: jid,
        patientId: pid,
        journeyTemplateId,
        startDate,
        status: 'ACTIVE',
        researchModuleIds: [],
        modifications: [],
        recurringCompletions: [],
        pausedAt: null,
        totalPausedDays: 0,
        createdAt,
        updatedAt: createdAt,
      })

      auditEvents.push({
        id: `fae-${idx}`,
        caseId,
        userId: palId,
        userRole: 'NURSE' as const,
        action: 'CASE_CREATED',
        details: { generated: true },
        timestamp: createdAt,
      })
    }
  }

  return {
    ...SEED_STATE,
    patients,
    cases,
    formResponses: [],
    journalDrafts: [],
    patientJourneys: journeys,
    auditEvents,
  }
}
