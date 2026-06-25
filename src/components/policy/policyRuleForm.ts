import { z } from 'zod'
import { validateExpression } from '../../api/policyParser'

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

export const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expression: z
    .string()
    .min(1, 'Expression is required')
    .superRefine((val, ctx) => {
      const err = validateExpression(val)
      if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err })
    }),
  severity: z.enum(SEVERITIES),
  description: z.string().optional(),
})

export type RuleForm = z.infer<typeof ruleSchema>
