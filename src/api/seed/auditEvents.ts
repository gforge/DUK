import { iso, daysAgo } from './shared'
import type { AuditEvent } from '../schemas'

export const auditEvents: AuditEvent[] = [
  {
    id: 'ae-1',
    caseId: 'case-1',
    userId: 'user-nurse-1',
    userRole: 'NURSE',
    action: 'CASE_CREATED',
    timestamp: iso(daysAgo(14)),
  },
  {
    id: 'ae-2',
    caseId: 'case-1',
    userId: 'user-nurse-1',
    userRole: 'NURSE',
    action: 'STATUS_CHANGED',
    details: { from: 'NEW', to: 'NEEDS_REVIEW' },
    timestamp: iso(daysAgo(2)),
  },
  {
    id: 'ae-3',
    caseId: 'case-3',
    userId: 'user-pal-1',
    userRole: 'PAL',
    action: 'TRIAGED',
    details: { nextStep: 'DIGITAL_CONTROL' },
    timestamp: iso(daysAgo(2)),
  },
  {
    id: 'ae-4',
    caseId: 'case-6',
    userId: 'user-pal-1',
    userRole: 'PAL',
    action: 'CASE_CLOSED',
    details: { reason: 'Normal course at 6-month mark' },
    timestamp: iso(daysAgo(7)),
  },
  {
    id: 'ae-5',
    caseId: 'case-8',
    userId: 'user-pal-1',
    userRole: 'PAL',
    action: 'STATUS_CHANGED',
    details: { from: 'TRIAGED', to: 'FOLLOWING_UP' },
    timestamp: iso(daysAgo(3)),
  },
]
