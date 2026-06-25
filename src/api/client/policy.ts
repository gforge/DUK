import type { Case,PolicyRule } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getPolicyRules = (journeyTemplateId: string): Promise<PolicyRule[]> =>
  withDelay(() => service.getPolicyRules(journeyTemplateId))

export const savePolicyRule = (
  rule: Omit<PolicyRule, 'id' | 'createdAt'> & { id?: string },
): Promise<PolicyRule> => withDelay(() => service.savePolicyRule(rule))

export const deletePolicyRule = (ruleId: string): Promise<void> =>
  withDelay(() => service.deletePolicyRule(ruleId))

export const reEvaluatePolicyForCase = (caseId: string): Promise<Case> =>
  withDelay(() => service.reEvaluatePolicyForCase(caseId))
