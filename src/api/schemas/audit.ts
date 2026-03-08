import { z } from 'zod'

import { RoleSchema } from './enums'

export const AuditEventSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  userId: z.string(),
  userRole: RoleSchema,
  action: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
})
export type AuditEvent = z.infer<typeof AuditEventSchema>
