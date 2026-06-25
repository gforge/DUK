import type { AuditEvent, Role } from '../schemas'
import * as service from '../service'
import type { ContactAction } from '../service/audit'
import { withDelay } from './delay'

export type { ContactAction }

export const getAuditEvents = (caseId: string): Promise<AuditEvent[]> =>
  withDelay(() => service.getAuditEvents(caseId))

export const logContactEvent = (
  caseId: string,
  userId: string,
  userRole: Role,
  action: ContactAction,
): Promise<void> => withDelay(() => service.logContactEvent(caseId, userId, userRole, action))
