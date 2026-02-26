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
  /** Links this response to a specific journey step occurrence (for recurring completion tracking). */
  patientJourneyId: z.string().optional(),
  journeyStepId: z.string().optional(),
  occurrenceIndex: z.number().int().min(0).optional(),
})
export type FormResponse = z.infer<typeof FormResponseSchema>
