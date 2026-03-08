import { evaluateExpression } from '../policyParser'
import type {
  AppState,
  AuditEvent,
  FormResponse,
  PolicyRule,
  PolicyWarning,
  QuestionnaireTemplate,
  Role,
} from '../schemas'

export function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function now(): string {
  return new Date().toISOString()
}

export function computeScores(
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

export function buildPolicyScope(responses: FormResponse[]): Record<string, number> {
  const scope: Record<string, number> = {}
  for (const resp of responses) {
    for (const [k, v] of Object.entries(resp.answers)) scope[k] = Number(v)
    for (const [k, v] of Object.entries(resp.scores)) scope[k] = v
  }
  return scope
}

export function evaluatePolicyRules(
  rules: PolicyRule[],
  scope: Record<string, number>,
): PolicyWarning[] {
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

export function addAuditEvent(
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
