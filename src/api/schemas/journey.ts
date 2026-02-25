import { z } from 'zod'
import { CaseCategorySchema } from './enums'

export const PatientJourneyStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED'])
export type PatientJourneyStatus = z.infer<typeof PatientJourneyStatusSchema>

export const JourneyModificationTypeSchema = z.enum(['ADD_STEP', 'REMOVE_STEP', 'SWITCH_TEMPLATE'])
export type JourneyModificationType = z.infer<typeof JourneyModificationTypeSchema>

/**
 * One step inside a reusable journey template.
 * scoreAliases maps raw score keys to semantic journey-relative names,
 * e.g. { "PNRS_2": "PNRS_week4", "OSS.total": "OSS_week4" }.
 * Allows policy rules to reference time-point values independently of journey type.
 */
export const JourneyTemplateEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  offsetDays: z.number(),
  windowDays: z.number().default(2),
  order: z.number(),
  templateId: z.string(),
  scoreAliases: z.record(z.string(), z.string()).default({}),
  /** Human-readable labels for each alias, used in journal templates via {{label.X}}. */
  scoreAliasLabels: z.record(z.string(), z.string()).default({}),
  /** Which dashboard column is active while this step's window is open. */
  dashboardCategory: CaseCategorySchema.default('CONTROL'),
})
export type JourneyTemplateEntry = z.infer<typeof JourneyTemplateEntrySchema>

export const JourneyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  entries: z.array(JourneyTemplateEntrySchema),
  createdAt: z.string().datetime(),
})
export type JourneyTemplate = z.infer<typeof JourneyTemplateSchema>

export const ResearchModuleEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  replaceStepId: z.string().optional(),
  offsetDays: z.number().optional(),
  templateId: z.string(),
})
export type ResearchModuleEntry = z.infer<typeof ResearchModuleEntrySchema>

export const ResearchModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  studyName: z.string(),
  entries: z.array(ResearchModuleEntrySchema),
  createdAt: z.string().datetime(),
})
export type ResearchModule = z.infer<typeof ResearchModuleSchema>

export const JourneyModificationSchema = z.object({
  id: z.string(),
  type: JourneyModificationTypeSchema,
  addedByUserId: z.string(),
  addedAt: z.string().datetime(),
  reason: z.string(),
  entry: JourneyTemplateEntrySchema.optional(),
  stepId: z.string().optional(),
  previousTemplateId: z.string().optional(),
  newTemplateId: z.string().optional(),
})
export type JourneyModification = z.infer<typeof JourneyModificationSchema>

export const PatientJourneySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  journeyTemplateId: z.string(),
  startDate: z.string(), // YYYY-MM-DD
  status: PatientJourneyStatusSchema,
  researchModuleIds: z.array(z.string()),
  modifications: z.array(JourneyModificationSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type PatientJourney = z.infer<typeof PatientJourneySchema>
