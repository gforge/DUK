import type { Case, PolicyRule, PolicyWarning } from '../schemas'
import { getStore, setStore } from '../storage'
import { buildPolicyScopeWithAliases } from './journeyResolver'
import { evaluatePolicyRules,now, uuid } from './utils'

/** Returns all rules for a specific journey template. */
export function getPolicyRules(journeyTemplateId: string): PolicyRule[] {
  return getStore().policyRules.filter((r) => r.journeyTemplateId === journeyTemplateId)
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
  }
  const newRule: PolicyRule = { ...rule, id: uuid(), createdAt: now() } as PolicyRule
  setStore({ ...state, policyRules: [...state.policyRules, newRule] })
  return newRule
}

export function deletePolicyRule(ruleId: string): void {
  const state = getStore()
  setStore({ ...state, policyRules: state.policyRules.filter((r) => r.id !== ruleId) })
}

export function reEvaluatePolicyForCase(caseId: string): Case {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)!
  const responses = state.formResponses.filter((r) => r.caseId === caseId)
  const scope = buildPolicyScopeWithAliases(responses, caseData.patientId)

  // Only evaluate rules belonging to the patient's active journey template
  const activeJourney = state.patientJourneys
    .filter((j) => j.patientId === caseData.patientId && j.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const applicableRules = activeJourney
    ? state.policyRules.filter((r) => r.journeyTemplateId === activeJourney.journeyTemplateId)
    : []

  const warnings: PolicyWarning[] = evaluatePolicyRules(applicableRules, scope)
  const updated: Case = { ...caseData, policyWarnings: warnings, lastActivityAt: now() }
  setStore({ ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) })
  return updated
}
