import { z } from 'zod'

export const PolicyRuleSchema = z.object({
  id: z.string(),
  /** The journey template this rule applies to. Rules are evaluated only for
   * cases whose patient has an active journey using this template. */
  journeyTemplateId: z.string(),
  name: z.string(),
  expression: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
})
export type PolicyRule = z.infer<typeof PolicyRuleSchema>
