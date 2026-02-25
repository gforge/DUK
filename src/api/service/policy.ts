import { getStore, setStore } from '../storage'
import { uuid, now, evaluatePolicyRules } from './utils'
import { buildPolicyScopeWithAliases } from './journeyResolver'
import type { Case, PolicyRule, PolicyWarning } from '../schemas'

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
  const warnings: PolicyWarning[] = evaluatePolicyRules(state.policyRules, scope)
  const updated: Case = { ...caseData, policyWarnings: warnings, lastActivityAt: now() }
  setStore({ ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) })
  return updated
}
