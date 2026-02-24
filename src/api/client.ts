/**
 * API Client — thin async wrapper over the service layer.
 * Simulates network latency (100–400 ms) and occasional errors.
 * UI components always call this, never the service directly.
 */

import * as service from './service'
import type {
  AppState,
  AuditEvent,
  Case,
  CaseStatus,
  FormResponse,
  JournalDraft,
  JournalTemplate,
  Patient,
  PolicyRule,
  QuestionnaireTemplate,
  FormSeries,
  TriageInput,
  Role,
  User,
} from './schemas'

const MIN_DELAY = 100
const MAX_DELAY = 400

function delay(ms?: number): Promise<void> {
  const d = ms ?? MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY))
  return new Promise((resolve) => setTimeout(resolve, d))
}

async function withDelay<T>(fn: () => T): Promise<T> {
  await delay()
  return fn()
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = (): Promise<User[]> => withDelay(() => service.getUsers())

// ─── Patients ─────────────────────────────────────────────────────────────────

export const getPatients = (): Promise<Patient[]> => withDelay(() => service.getPatients())

export const getPatient = (id: string): Promise<Patient | undefined> =>
  withDelay(() => service.getPatient(id))

export const patientOpenedApp = (patientId: string): Promise<Patient> =>
  withDelay(() => service.patientOpenedApp(patientId))

// ─── Cases ────────────────────────────────────────────────────────────────────

export const getCases = (): Promise<Case[]> => withDelay(() => service.getCases())

export const getCasesByPatient = (patientId: string): Promise<Case[]> =>
  withDelay(() => service.getCases().filter((c) => c.patientId === patientId))

export const getCase = (id: string): Promise<Case | undefined> =>
  withDelay(() => service.getCase(id))

export const triageCase = (
  caseId: string,
  input: TriageInput,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.triageCase(caseId, input, userId, userRole))

export const advanceCaseStatus = (
  caseId: string,
  toStatus: CaseStatus,
  userId: string,
  userRole: Role,
): Promise<Case> => withDelay(() => service.advanceCaseStatus(caseId, toStatus, userId, userRole))

// ─── Form Responses ────────────────────────────────────────────────────────────

export const getFormResponses = (caseId: string): Promise<FormResponse[]> =>
  withDelay(() => service.getFormResponses(caseId))

export const submitFormResponse = (
  patientId: string,
  caseId: string,
  templateId: string,
  answers: Record<string, string | number | boolean>,
): Promise<FormResponse> =>
  withDelay(() => service.submitFormResponse(patientId, caseId, templateId, answers))

export const seekContact = (patientId: string, caseId: string): Promise<Case> =>
  withDelay(() => service.seekContact(patientId, caseId))

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const getAuditEvents = (caseId: string): Promise<AuditEvent[]> =>
  withDelay(() => service.getAuditEvents(caseId))

// ─── Journal ──────────────────────────────────────────────────────────────────

export const getJournalDrafts = (caseId: string): Promise<JournalDraft[]> =>
  withDelay(() => service.getJournalDrafts(caseId))

export const getJournalTemplates = (): Promise<JournalTemplate[]> =>
  withDelay(() => service.getJournalTemplates())

export const generateJournalDraft = (
  caseId: string,
  templateId: string,
  userId: string,
  userRole: Role,
): Promise<JournalDraft> =>
  withDelay(() => service.generateJournalDraft(caseId, templateId, userId, userRole))

export const approveJournalDraft = (
  draftId: string,
  userId: string,
  userRole: Role,
): Promise<JournalDraft> => withDelay(() => service.approveJournalDraft(draftId, userId, userRole))

// ─── Policy ───────────────────────────────────────────────────────────────────

export const getPolicyRules = (): Promise<PolicyRule[]> => withDelay(() => service.getPolicyRules())

export const savePolicyRule = (
  rule: Omit<PolicyRule, 'id' | 'createdAt'> & { id?: string },
): Promise<PolicyRule> => withDelay(() => service.savePolicyRule(rule))

export const deletePolicyRule = (ruleId: string): Promise<void> =>
  withDelay(() => service.deletePolicyRule(ruleId))

export const reEvaluatePolicyForCase = (caseId: string): Promise<Case> =>
  withDelay(() => service.reEvaluatePolicyForCase(caseId))

// ─── Questionnaires ───────────────────────────────────────────────────────────

export const getQuestionnaireTemplates = (): Promise<QuestionnaireTemplate[]> =>
  withDelay(() => service.getQuestionnaireTemplates())

export const getFormSeries = (): Promise<FormSeries[]> => withDelay(() => service.getFormSeries())

// ─── Demo Tools ───────────────────────────────────────────────────────────────

export const exportState = (): Promise<AppState> => withDelay(() => service.exportState())

export const importState = (state: AppState): Promise<void> =>
  withDelay(() => service.importState(state))

export const resetAndReseed = (): Promise<void> => withDelay(() => service.resetAndReseed())
