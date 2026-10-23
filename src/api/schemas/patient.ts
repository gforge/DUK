import { z } from 'zod'

export const PatientSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  personalNumber: z.string(),
  dateOfBirth: z.string(), // YYYY-MM-DD
  palId: z.string().optional(),
  lastOpenedAt: z.string().datetime().optional(),
  /** No e-ID or app: forms are never sent, staff contact the patient at each checkpoint. */
  noDigitalChannel: z.boolean().optional(),
  /** Phone number staff call; shown in the triage "ringer nu" flow. */
  phone: z.string().optional(),
  createdAt: z.string().datetime(),
})
export type Patient = z.infer<typeof PatientSchema>
