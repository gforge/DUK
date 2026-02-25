import * as service from '../service'
import type { PolicyRule, Case } from '../schemas'
import { withDelay } from './delay'

export const getPolicyRules = (): Promise<PolicyRule[]> => withDelay(() => service.getPolicyRules())

export const savePolicyRule = (
  rule: Omit<PolicyRule, 'id' | 'createdAt'> & { id?: string },
): Promise<PolicyRule> => withDelay(() => service.savePolicyRule(rule))

export const deletePolicyRule = (ruleId: string): Promise<void> =>
  withDelay(() => service.deletePolicyRule(ruleId))

export const reEvaluatePolicyForCase = (caseId: string): Promise<Case> =>
  withDelay(() => service.reEvaluatePolicyForCase(caseId))
