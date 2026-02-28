import * as service from '../service'
import type { AuditEvent, Role } from '../schemas'
import { withDelay } from './delay'
import type { ContactAction } from '../service/audit'

export type { ContactAction }

export const getAuditEvents = (caseId: string): Promise<AuditEvent[]> =>
  withDelay(() => service.getAuditEvents(caseId))

export const logContactEvent = (
  caseId: string,
  userId: string,
  userRole: Role,
  action: ContactAction,
): Promise<void> => withDelay(() => service.logContactEvent(caseId, userId, userRole, action))
