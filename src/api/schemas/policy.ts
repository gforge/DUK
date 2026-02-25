import { z } from 'zod'

export const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  expression: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
})
export type PolicyRule = z.infer<typeof PolicyRuleSchema>
