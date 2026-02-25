import { z } from 'zod'

export const FormResponseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  templateId: z.string(),
  caseId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  scores: z.record(z.string(), z.number()),
  submittedAt: z.string().datetime(),
  imageUrl: z.string().optional(),
})
export type FormResponse = z.infer<typeof FormResponseSchema>
