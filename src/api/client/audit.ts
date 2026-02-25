import * as service from '../service'
import type { AuditEvent } from '../schemas'
import { withDelay } from './delay'

export const getAuditEvents = (caseId: string): Promise<AuditEvent[]> =>
  withDelay(() => service.getAuditEvents(caseId))
