import { z } from 'zod'

import { QuestionTypeSchema } from './enums'

export const QuestionSchema = z.object({
  id: z.string(),
  key: z.string(), // used in policy expressions, e.g. "PNRS_1"
  type: QuestionTypeSchema,
  label: z.record(z.string(), z.string()).default({}), // locale map, e.g. { sv: "Smärta nu (0–10)" }
  required: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.record(z.string(), z.string()) }))
    .optional(),
})
export type Question = z.infer<typeof QuestionSchema>

export const QuestionnaireTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  descriptionKey: z.string().optional(),
  questions: z.array(QuestionSchema),
  scoringRules: z.array(
    z.object({
      outputKey: z.string(), // e.g. "OSS.total"
      formula: z.enum(['SUM', 'AVERAGE', 'MAX', 'DIRECT']),
      inputKeys: z.array(z.string()),
      scale: z.number().optional(),
    }),
  ),
  createdAt: z.string().datetime(),
})
export type QuestionnaireTemplate = z.infer<typeof QuestionnaireTemplateSchema>

export const FormSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  entries: z.array(
    z.object({
      templateId: z.string(),
      offsetDays: z.number(),
      order: z.number(),
    }),
  ),
  createdAt: z.string().datetime(),
})
export type FormSeries = z.infer<typeof FormSeriesSchema>
