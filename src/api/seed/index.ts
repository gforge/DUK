import type { AppState } from '../schemas'
import { CURRENT_SCHEMA_VERSION } from '../schemaVersion'
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
import { ensureAllUsers } from '../utils/userGenerator'

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
  patientJourneys,
  instructionTemplates,
  researchConsents: [],
}

export const SEED_STATE: AppState = {
  ...baseSeedState,
  users: ensureAllUsers(baseSeedState),
}
