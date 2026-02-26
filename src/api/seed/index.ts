import type { AppState } from '../schemas'
import { users, patients } from './users'
import { cases } from './cases'
import { policyRules } from './policyRules'
import { auditEvents } from './auditEvents'
import { questionnaireTemplates } from './questionnaireTemplates'
import { formSeries } from './formSeries'
import { formResponses } from './formResponses'
import { journalDrafts } from './journalDrafts'
import { journalTemplates } from './journalTemplates'
import { journeyTemplates } from './journeyTemplates'
import { researchModules } from './researchModules'
import { patientJourneys } from './patientJourneys'
import { instructionTemplates } from './instructionTemplates'

export const SEED_STATE: AppState = {
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
  patientJourneys,
  instructionTemplates,
}
