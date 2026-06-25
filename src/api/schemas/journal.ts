import { z } from 'zod'

import { JournalDraftStatusSchema } from './enums'

export const JournalDraftSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  templateId: z.string().optional(),
  content: z.string(),
  status: JournalDraftStatusSchema,
  createdByUserId: z.string(),
  approvedByUserId: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type JournalDraft = z.infer<typeof JournalDraftSchema>

export const JournalTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(),
  /** ISO 639-1 language code, e.g. 'sv', 'en'. Default 'sv'. */
  language: z.string().default('sv'),
  createdAt: z.string().datetime(),
})
export type JournalTemplate = z.infer<typeof JournalTemplateSchema>
