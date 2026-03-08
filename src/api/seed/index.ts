import type { AppState } from '../schemas'
import { CURRENT_SCHEMA_VERSION } from '../schemaVersion'
import { ensureAllUsers } from '../utils/userGenerator'
import { auditEvents } from './auditEvents'
import { cases } from './cases'
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
  instructions: [],
  instructionTemplates,
  researchConsents: [],
}

export const SEED_STATE: AppState = {
  ...baseSeedState,
  users: ensureAllUsers(baseSeedState),
}
