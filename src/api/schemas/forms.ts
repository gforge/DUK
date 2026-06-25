import { z } from 'zod'

export const FormResponseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  templateId: z.string(),
  /** Case this response belongs to. Optional for journey-driven PRO forms that have no associated case. */
  caseId: z.string().optional(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  scores: z.record(z.string(), z.number()),
  submittedAt: z.string().datetime(),
  imageUrl: z.string().optional(),
  /** Links this response to a specific journey step occurrence (for recurring completion tracking). */
  patientJourneyId: z.string().optional(),
  journeyTemplateEntryId: z.string().optional(),
  occurrenceIndex: z.number().int().min(0).optional(),
})
export type FormResponse = z.infer<typeof FormResponseSchema>
