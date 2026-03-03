import type { AppState, Case, Patient, PatientJourney, AuditEvent } from '../schemas'
import { SEED_STATE } from '../seed'
import {
  TRIGGERS,
  PAL_IDS,
  isoDateOffset as isoDate,
  isoTsOffset as isoTs,
} from '../seed/seedHelpers'
import { makePrng } from './prng'
import { FIRST_NAMES, LAST_NAMES, personalNumber } from './namePools'
import { COHORTS } from './cohorts'
import { ensureAllUsers } from '../utils/userGenerator'

function generateReviews(rng: ReturnType<typeof makePrng>, caseId: string, createdAt: string) {
  const reviews = []
  const reviewProb = 0.15 // ~15% of cases have pending reviews

  if (rng.bool(reviewProb)) {
    const type: 'LAB' | 'XRAY' = rng.bool(0.5) ? 'LAB' : 'XRAY'
    reviews.push({
      id: `${caseId}-rev-${rng.int(0, 9999)}`,
      type,
      createdAt,
      createdByUserId: '???',
      createdByRole: 'NURSE' as const,
      source: 'MANUAL' as const,
      reviewedAt: null,
      reviewedByUserId: undefined,
      reviewedByRole: undefined,
      note: null,
    })
  }

  return reviews
}

export function buildRealisticSeed(): AppState {
  const rng = makePrng(0xdeadbeef)

  const patients: Patient[] = []
  const cases: Case[] = []
  const journeys: PatientJourney[] = []
  const auditEvents: AuditEvent[] = []

  let idx = 0

  for (const cohort of COHORTS) {
    for (let c = 0; c < cohort.count; c++, idx++) {
      const pid = `rp-${idx}`
      const caseId = `rc-${idx}`
      const jid = `rj-${idx}`

      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length]
      const lastName = LAST_NAMES[(idx * 7 + c * 3) % LAST_NAMES.length]
      const birthYear = rng.int(1940, 1980)
      const displayName = `${firstName} ${lastName}`

      const palId = PAL_IDS[idx % PAL_IDS.length]
      const hasTriggers = rng.bool(cohort.triggerProb)
      const baseTriggers = hasTriggers ? [TRIGGERS[rng.int(0, TRIGGERS.length - 1)]] : []
      const isComplex = rng.bool(cohort.complexProb)
      const journeyTemplateId = isComplex ? 'jt-complex' : 'jt-standard'

      const startDate = isoDate(-cohort.startDaysAgo)
      const createdAt = isoTs(-cohort.startDaysAgo)

      // Generate reviews for this case
      const reviews = generateReviews(rng, caseId, createdAt)

      // Add review triggers if there are pending reviews
      const triggers = [...baseTriggers]
      if (reviews.length > 0) {
        const pendingReviews = reviews.filter((r) => r.reviewedAt === null)
        const reviewTypes = new Set(pendingReviews.map((r) => r.type))
        if (reviewTypes.has('LAB')) triggers.push('LAB_PENDING' as any)
        if (reviewTypes.has('XRAY')) triggers.push('XRAY_PENDING' as any)
      }

      let status: Case['status']
      if (triggers.length > 0) {
        status = 'NEEDS_REVIEW'
      } else if (rng.bool(0.3)) {
        status = 'TRIAGED'
      } else if (rng.bool(0.5)) {
        status = 'FOLLOWING_UP'
      } else {
        status = 'NEW'
      }

      patients.push({
        id: pid,
        displayName,
        personalNumber: personalNumber(birthYear, idx),
        dateOfBirth: `${birthYear}-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}`,
        palId,
        lastOpenedAt: triggers.length > 0 ? isoTs(-rng.int(1, 7)) : isoTs(-rng.int(1, 30)),
        createdAt,
      })

      cases.push({
        id: caseId,
        patientId: pid,
        category: 'CONTROL',
        status,
        triggers: triggers as Case['triggers'],
        policyWarnings: [],
        createdByUserId: palId,
        createdAt,
        scheduledAt: createdAt,
        lastActivityAt: isoTs(-rng.int(0, 3)),
        reviews,
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
        id: `rae-${idx}`,
        caseId,
        userId: palId,
        userRole: 'NURSE' as const,
        action: 'CASE_CREATED',
        details: { cohort: cohort.label },
        timestamp: createdAt,
      })
    }
  }

  const baseState = {
    ...SEED_STATE,
    patients,
    cases,
    formResponses: [],
    journalDrafts: [],
    patientJourneys: journeys,
    auditEvents,
  }

  return {
    ...baseState,
    users: ensureAllUsers(baseState),
  }
}
