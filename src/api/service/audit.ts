import { getStore } from '../storage'
import type { AuditEvent } from '../schemas'

export function getAuditEvents(caseId: string): AuditEvent[] {
  return getStore().auditEvents.filter((e) => e.caseId === caseId)
}
