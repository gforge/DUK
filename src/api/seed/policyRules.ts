import { iso, daysAgo } from './shared'
import type { PolicyRule } from '../schemas'

export const policyRules: PolicyRule[] = [
  {
    id: 'rule-1',
    journeyTemplateId: 'jt-standard',
    name: 'Smärta minskar inte',
    expression: 'PNRS_1 - PNRS_2 <= 0',
    severity: 'HIGH',
    enabled: true,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'rule-2',
    journeyTemplateId: 'jt-standard',
    name: 'Låg funktion (OSS)',
    expression: 'OSS.total < 30',
    severity: 'MEDIUM',
    enabled: true,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'rule-3',
    journeyTemplateId: 'jt-standard',
    name: 'Låg livskvalitet (EQ-5D)',
    expression: 'EQ5D.index < 0.5',
    severity: 'MEDIUM',
    enabled: true,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'rule-4',
    journeyTemplateId: 'jt-standard',
    name: 'Hög smärta (VAS)',
    expression: 'PNRS_2 >= 7',
    severity: 'HIGH',
    enabled: true,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'rule-5',
    journeyTemplateId: 'jt-standard',
    name: 'Låg EQ VAS',
    expression: 'EQ_VAS < 50',
    severity: 'LOW',
    enabled: false,
    createdAt: iso(daysAgo(100)),
  },
]
