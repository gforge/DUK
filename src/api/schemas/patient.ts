import { z } from 'zod'

export const PatientSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  personalNumber: z.string(),
  dateOfBirth: z.string(), // YYYY-MM-DD
  palId: z.string().optional(),
  lastOpenedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
})
export type Patient = z.infer<typeof PatientSchema>
