import { z } from 'zod'
import { TriageInputSchema } from '../../../api/schemas'

export const TriageFormSchema = TriageInputSchema.extend({
  deadline: z.string().optional(),
  closeImmediately: z.boolean(),
  bookingNote: z.string().optional(),
})

export type TriageForm = z.infer<typeof TriageFormSchema>
