import { getStore, patchStore } from '../storage'
import type { AuditEvent, Role } from '../schemas'
import { addAuditEvent } from './utils'

export type ContactAction = 'CONTACTED' | 'REMINDER_SENT'

export function getAuditEvents(caseId: string): AuditEvent[] {
  return getStore().auditEvents.filter((e) => e.caseId === caseId)
}

export function logContactEvent(
  caseId: string,
  userId: string,
  userRole: Role,
  action: ContactAction,
): void {
  patchStore((state) => addAuditEvent(state, caseId, userId, userRole, action))
}
