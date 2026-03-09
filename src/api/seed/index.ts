import type { AppState, Case, TriageDecision } from '../schemas'
import { CURRENT_SCHEMA_VERSION } from '../schemaVersion'
import { ensureAllUsers } from '../utils/userGenerator'
import { auditEvents } from './auditEvents'
import { cases } from './cases'
import { episodesOfCare } from './episodesOfCare'
import { formResponses } from './formResponses'
import { formSeries } from './formSeries'
import { instructionTemplates } from './instructionTemplates'
import { journalDrafts } from './journalDrafts'
import { journalTemplates } from './journalTemplates'
import { journeyTemplates } from './journeyTemplates'
import { patientJourneys } from './patientJourneys'
import { policyRules } from './policyRules'
import { questionnaireTemplates } from './questionnaireTemplates'
import { researchModules } from './researchModules'
import { patients, users } from './users'

const MS_PER_DAY = 86_400_000
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

const baseSeedState: AppState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  users,
  patients,
  cases,
  policyRules,
  auditEvents,
  questionnaireTemplates,
  formSeries,
  formResponses,
  journalDrafts,
  journalTemplates,
  journeyTemplates,
  researchModules,
  episodesOfCare,
  patientJourneys,
  instructions: [],
  instructionTemplates,
  researchConsents: [],
}

function dayStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function shiftIso(value: string, shiftDays: number): string {
  if (shiftDays === 0) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Date(parsed.getTime() + shiftDays * MS_PER_DAY).toISOString()
}

function shiftDate(value: string, shiftDays: number): string {
  if (shiftDays === 0) return value
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Date(parsed.getTime() + shiftDays * MS_PER_DAY).toISOString().slice(0, 10)
}

function shiftDatesDeep<T>(value: T, shiftDays: number): T {
  if (shiftDays === 0) return structuredClone(value)

  if (Array.isArray(value)) {
    return value.map((item) => shiftDatesDeep(item, shiftDays)) as T
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      shiftDatesDeep(v, shiftDays),
    ])
    return Object.fromEntries(entries) as T
  }

  if (typeof value === 'string') {
    if (ISO_DATETIME_RE.test(value)) return shiftIso(value, shiftDays) as T
    if (ISO_DATE_RE.test(value)) return shiftDate(value, shiftDays) as T
  }

  return value
}

function inferSeedAnchorDate(state: AppState): Date {
  const pj1 = state.patientJourneys.find((j) => j.id === 'pj-1')
  const baseline = pj1?.startDate ?? state.patientJourneys[0]?.startDate
  if (!baseline) return dayStart(new Date())

  const baselineDate = new Date(`${baseline}T00:00:00.000Z`)
  if (Number.isNaN(baselineDate.getTime())) return dayStart(new Date())

  // In minimal seed, pj-1 starts 14 days before "today".
  return dayStart(new Date(baselineDate.getTime() + 14 * MS_PER_DAY))
}

function buildBaseMinimalSeed(): AppState {
  const deriveDecision = (c: Case): TriageDecision | undefined => {
    if (c.triageDecision) return c.triageDecision

    if (c.nextStep === 'NO_ACTION') {
      return {
        contactMode: 'CLOSE',
        careRole: null,
        assignmentMode: null,
        assignedUserId: null,
        dueAt: c.deadline ?? null,
        note: c.internalNote ?? null,
      }
    }

    const fromNextStep: Record<
      Exclude<Case['nextStep'], undefined | 'NO_ACTION'>,
      { contactMode: 'VISIT' | 'PHONE' | 'DIGITAL'; careRole: 'DOCTOR' | 'NURSE' | 'PHYSIO' }
    > = {
      DOCTOR_VISIT: { contactMode: 'VISIT', careRole: 'DOCTOR' },
      NURSE_VISIT: { contactMode: 'VISIT', careRole: 'NURSE' },
      PHYSIO_VISIT: { contactMode: 'VISIT', careRole: 'PHYSIO' },
      PHONE_CALL: { contactMode: 'PHONE', careRole: 'NURSE' },
      DIGITAL_CONTROL: { contactMode: 'DIGITAL', careRole: 'NURSE' },
    }

    if (!c.nextStep || !(c.nextStep in fromNextStep)) return undefined

    const mapped = fromNextStep[c.nextStep]
    return {
      contactMode: mapped.contactMode,
      careRole: mapped.careRole,
      assignmentMode: 'ANY',
      assignedUserId: null,
      dueAt: c.deadline ?? null,
      note: c.internalNote ?? null,
    }
  }

  const patchedCases = baseSeedState.cases.map((c) => {
    const shouldStampDecision = c.status === 'TRIAGED' || c.status === 'FOLLOWING_UP'
    return shouldStampDecision ? { ...c, triageDecision: deriveDecision(c) ?? c.triageDecision } : c
  })

  return {
    ...baseSeedState,
    cases: patchedCases,
    users: ensureAllUsers(baseSeedState),
  }
}

export function buildMinimalSeed(today: Date = new Date()): AppState {
  const seed = buildBaseMinimalSeed()
  const target = dayStart(today)
  const anchor = inferSeedAnchorDate(seed)
  const shiftDays = Math.round((target.getTime() - anchor.getTime()) / MS_PER_DAY)
  return shiftDatesDeep(seed, shiftDays)
}

export const SEED_STATE: AppState = buildMinimalSeed()
