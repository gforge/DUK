/**
 * API Service — all state mutations go through here.
 * Never call storage directly from UI components.
 */

import { getStore, patchStore, setStore } from './storage'
import { SEED_STATE } from './seed'
import { evaluateExpression } from './policyParser'
import { renderTemplate } from './journalRenderer'
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
  PolicyWarning,
  QuestionnaireTemplate,
  FormSeries,
  TriageInput,
  Role,
  User,
  TriggerType,
} from './schemas'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function now(): string {
  return new Date().toISOString()
}

function computeScores(
  template: QuestionnaireTemplate,
  answers: Record<string, string | number | boolean>,
): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const rule of template.scoringRules) {
    const vals = rule.inputKeys.map((k) => Number(answers[k] ?? 0))
    let raw: number
    if (rule.formula === 'SUM') raw = vals.reduce((a, b) => a + b, 0)
    else if (rule.formula === 'AVERAGE') raw = vals.reduce((a, b) => a + b, 0) / vals.length
    else if (rule.formula === 'MAX') raw = Math.max(...vals)
    else raw = vals[0] ?? 0
    scores[rule.outputKey] = parseFloat(
      ((raw / rule.inputKeys.length) * (rule.scale ?? 1)).toFixed(2),
    )
  }
  return scores
}

function buildPolicyScope(responses: FormResponse[]): Record<string, number> {
  const scope: Record<string, number> = {}
  for (const resp of responses) {
    // answers
    for (const [k, v] of Object.entries(resp.answers)) {
      scope[k] = Number(v)
    }
    // computed scores
    for (const [k, v] of Object.entries(resp.scores)) {
      scope[k] = v
    }
  }
  return scope
}

function evaluatePolicyRules(rules: PolicyRule[], scope: Record<string, number>): PolicyWarning[] {
  const warnings: PolicyWarning[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    const result = evaluateExpression(rule.expression, scope)
    if (result.ok && result.result === true) {
      warnings.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        triggeredValues: result.resolvedVars,
        expression: rule.expression,
      })
    }
  }
  return warnings
}

function addAuditEvent(
  state: AppState,
  caseId: string,
  userId: string,
  userRole: Role,
  action: string,
  details?: Record<string, unknown>,
): AppState {
  const event: AuditEvent = {
    id: uuid(),
    caseId,
    userId,
    userRole,
    action,
    details,
    timestamp: now(),
  }
  return { ...state, auditEvents: [...state.auditEvents, event] }
}

// ─── User / Auth ──────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return getStore().users
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function getPatients(): Patient[] {
  return getStore().patients
}

export function getPatient(id: string): Patient | undefined {
  return getStore().patients.find((p) => p.id === id)
}

export function patientOpenedApp(patientId: string): Patient {
  const updated = patchStore((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === patientId ? { ...p, lastOpenedAt: now() } : p)),
  }))
  return updated.patients.find((p) => p.id === patientId)!
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export function getCases(): Case[] {
  return getStore().cases
}

export function getCase(id: string): Case | undefined {
  return getStore().cases.find((c) => c.id === id)
}

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: ['NEEDS_REVIEW'],
  NEEDS_REVIEW: ['TRIAGED'],
  TRIAGED: ['FOLLOWING_UP', 'CLOSED'],
  FOLLOWING_UP: ['CLOSED'],
  CLOSED: [],
}

export function triageCase(
  caseId: string,
  input: TriageInput,
  userId: string,
  userRole: Role,
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)

  const currentStatus = existing.status
  const nextStatus: CaseStatus = input.closeImmediately ? 'CLOSED' : 'TRIAGED'

  if (!VALID_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid transition: ${currentStatus} → ${nextStatus}`)
  }

  const updated: Case = {
    ...existing,
    status: nextStatus,
    nextStep: input.nextStep,
    deadline: input.deadline,
    internalNote: input.internalNote,
    patientMessage: input.patientMessage,
    assignedRole: input.assignedRole,
    assignedUserId: input.assignedUserId,
    triagedByUserId: userId,
    lastActivityAt: now(),
  }

  state = {
    ...state,
    cases: state.cases.map((c) => (c.id === caseId ? updated : c)),
  }

  state = addAuditEvent(state, caseId, userId, userRole, 'TRIAGED', {
    from: currentStatus,
    to: nextStatus,
    nextStep: input.nextStep,
    deadline: input.deadline,
    internalNote: input.internalNote,
    assignedRole: input.assignedRole,
  })

  setStore(state)
  return updated
}

export function advanceCaseStatus(
  caseId: string,
  toStatus: CaseStatus,
  userId: string,
  userRole: Role,
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)

  if (!VALID_TRANSITIONS[existing.status]?.includes(toStatus)) {
    throw new Error(`Invalid transition: ${existing.status} → ${toStatus}`)
  }

  const updated: Case = {
    ...existing,
    status: toStatus,
    lastActivityAt: now(),
  }

  state = {
    ...state,
    cases: state.cases.map((c) => (c.id === caseId ? updated : c)),
  }

  state = addAuditEvent(state, caseId, userId, userRole, 'STATUS_CHANGED', {
    from: existing.status,
    to: toStatus,
  })

  setStore(state)
  return updated
}

// ─── Form Responses ────────────────────────────────────────────────────────────

export function getFormResponses(caseId: string): FormResponse[] {
  return getStore().formResponses.filter((r) => r.caseId === caseId)
}

export function submitFormResponse(
  patientId: string,
  caseId: string,
  templateId: string,
  answers: Record<string, string | number | boolean>,
): FormResponse {
  let state = getStore()
  const template = state.questionnaireTemplates.find((t) => t.id === templateId)!
  const scores = template ? computeScores(template, answers) : {}

  // Re-evaluate policy warnings for this case
  const allResponses = [...state.formResponses.filter((r) => r.caseId === caseId)]
  const scope = buildPolicyScope(allResponses)
  // merge new answers/scores into scope
  Object.entries(answers).forEach(([k, v]) => (scope[k] = Number(v)))
  Object.entries(scores).forEach(([k, v]) => (scope[k] = v))

  const warnings = evaluatePolicyRules(state.policyRules, scope)

  // Detect triggers
  const triggers: TriggerType[] = []
  if (Number(answers['PNRS_2'] ?? answers['PNRS_1'] ?? 0) >= 7) triggers.push('HIGH_PAIN')
  if (answers['INF_WOUND'] === true || answers['INF_FEVER'] === true)
    triggers.push('INFECTION_SUSPECTED')
  if (scores['OSS.total'] && scores['OSS.total'] < 30) triggers.push('LOW_FUNCTION')
  if (scores['EQ5D.index'] && scores['EQ5D.index'] < 0.5) triggers.push('LOW_QOL')

  const response: FormResponse = {
    id: uuid(),
    patientId,
    caseId,
    templateId,
    answers,
    scores,
    submittedAt: now(),
  }

  // Update case
  const existingCase = state.cases.find((c) => c.id === caseId)!
  const updatedCase: Case = {
    ...existingCase,
    triggers: [...new Set([...existingCase.triggers, ...triggers])],
    policyWarnings: warnings,
    lastActivityAt: now(),
    status: existingCase.status === 'NEW' ? 'NEEDS_REVIEW' : existingCase.status,
  }

  state = {
    ...state,
    formResponses: [...state.formResponses, response],
    cases: state.cases.map((c) => (c.id === caseId ? updatedCase : c)),
  }

  state = addAuditEvent(state, caseId, patientId, 'PATIENT', 'FORM_SUBMITTED', {
    templateId,
    scores,
    triggersAdded: triggers,
  })

  setStore(state)
  return response
}

export function seekContact(patientId: string, caseId: string): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error('Case not found')

  const updated: Case = {
    ...existing,
    triggers: [...new Set([...existing.triggers, 'SEEK_CONTACT' as TriggerType])],
    lastActivityAt: now(),
    status: existing.status === 'NEW' ? 'NEEDS_REVIEW' : existing.status,
  }

  state = {
    ...state,
    cases: state.cases.map((c) => (c.id === caseId ? updated : c)),
  }
  state = addAuditEvent(state, caseId, patientId, 'PATIENT', 'SEEK_CONTACT', {})
  setStore(state)
  return updated
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function getAuditEvents(caseId: string): AuditEvent[] {
  return getStore().auditEvents.filter((e) => e.caseId === caseId)
}

// ─── Journal Drafts ───────────────────────────────────────────────────────────

export function getJournalDrafts(caseId: string): JournalDraft[] {
  return getStore().journalDrafts.filter((d) => d.caseId === caseId)
}

export function getJournalTemplates(): JournalTemplate[] {
  return getStore().journalTemplates
}

export function generateJournalDraft(
  caseId: string,
  templateId: string,
  userId: string,
  userRole: Role,
): JournalDraft {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)!
  const patient = state.patients.find((p) => p.id === caseData.patientId)!
  const template = state.journalTemplates.find((t) => t.id === templateId)!
  const responses = state.formResponses.filter((r) => r.caseId === caseId)
  const latestResponse =
    responses.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0] ?? null

  const content = renderTemplate(template.body, { patient, caseData, latestResponse })

  const draft: JournalDraft = {
    id: uuid(),
    caseId,
    templateId,
    content,
    status: 'DRAFT',
    createdByUserId: userId,
    createdAt: now(),
    updatedAt: now(),
  }

  let newState: AppState = {
    ...state,
    journalDrafts: [...state.journalDrafts, draft],
  }
  newState = addAuditEvent(newState, caseId, userId, userRole, 'JOURNAL_DRAFT_CREATED', {
    templateId,
  })
  setStore(newState)
  return draft
}

export function approveJournalDraft(draftId: string, userId: string, userRole: Role): JournalDraft {
  let state = getStore()
  const draft = state.journalDrafts.find((d) => d.id === draftId)
  if (!draft) throw new Error('Draft not found')

  const updated: JournalDraft = {
    ...draft,
    status: 'APPROVED',
    approvedByUserId: userId,
    approvedAt: now(),
    updatedAt: now(),
  }

  state = {
    ...state,
    journalDrafts: state.journalDrafts.map((d) => (d.id === draftId ? updated : d)),
  }
  state = addAuditEvent(state, draft.caseId, userId, userRole, 'JOURNAL_DRAFT_APPROVED', {
    draftId,
  })
  setStore(state)
  return updated
}

// ─── Policy Rules ─────────────────────────────────────────────────────────────

export function getPolicyRules(): PolicyRule[] {
  return getStore().policyRules
}

export function savePolicyRule(
  rule: Omit<PolicyRule, 'id' | 'createdAt'> & { id?: string },
): PolicyRule {
  const state = getStore()
  const existing = rule.id ? state.policyRules.find((r) => r.id === rule.id) : null

  if (existing) {
    const updated: PolicyRule = { ...existing, ...rule, id: existing.id }
    setStore({
      ...state,
      policyRules: state.policyRules.map((r) => (r.id === existing.id ? updated : r)),
    })
    return updated
  } else {
    const newRule: PolicyRule = { ...rule, id: uuid(), createdAt: now() } as PolicyRule
    setStore({ ...state, policyRules: [...state.policyRules, newRule] })
    return newRule
  }
}

export function deletePolicyRule(ruleId: string): void {
  const state = getStore()
  setStore({ ...state, policyRules: state.policyRules.filter((r) => r.id !== ruleId) })
}

export function reEvaluatePolicyForCase(caseId: string): Case {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)!
  const responses = state.formResponses.filter((r) => r.caseId === caseId)
  const scope = buildPolicyScope(responses)
  const warnings = evaluatePolicyRules(state.policyRules, scope)

  const updated: Case = { ...caseData, policyWarnings: warnings, lastActivityAt: now() }
  setStore({
    ...state,
    cases: state.cases.map((c) => (c.id === caseId ? updated : c)),
  })
  return updated
}

// ─── Questionnaire Templates & Form Series ─────────────────────────────────────

export function getQuestionnaireTemplates(): QuestionnaireTemplate[] {
  return getStore().questionnaireTemplates
}

export function getFormSeries(): FormSeries[] {
  return getStore().formSeries
}

// ─── Demo Tools ───────────────────────────────────────────────────────────────

export function exportState(): AppState {
  return getStore()
}

export function importState(state: AppState): void {
  setStore(state)
}

export function resetAndReseed(): void {
  setStore(SEED_STATE)
}
