import { z } from 'zod'

import {
  CaseCategorySchema,
  CaseStatusSchema,
  NextStepSchema,
  ReviewOutcomeSchema,
  ReviewTypeSchema,
  RoleSchema,
  TriggerTypeSchema,
} from './enums'

export const PolicyWarningSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  triggeredValues: z.record(z.string(), z.number()),
  expression: z.string(),
})
export type PolicyWarning = z.infer<typeof PolicyWarningSchema>

export const ClinicalReviewSchema = z.object({
  id: z.string(),
  type: ReviewTypeSchema,
  createdAt: z.string().datetime(),
  createdByUserId: z.string(),
  createdByRole: RoleSchema,
  reviewedAt: z.string().datetime().nullable().default(null),
  reviewedByUserId: z.string().optional(),
  reviewedByRole: RoleSchema.optional(),
  outcome: ReviewOutcomeSchema.optional(),
  note: z.string().nullable().default(null),
  source: z.enum(['JOURNEY', 'MANUAL']).default('MANUAL'),
  /** Label of the journey step this review was ordered for (e.g. '2 veckor', '6 månader'). */
  journeyStepLabel: z.string().optional(),
})
export type ClinicalReview = z.infer<typeof ClinicalReviewSchema>

export const CaseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  category: CaseCategorySchema,
  status: CaseStatusSchema,
  triggers: z.array(TriggerTypeSchema),
  policyWarnings: z.array(PolicyWarningSchema),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  createdByUserId: z.string(),
  triagedByUserId: z.string().optional(),
  nextStep: NextStepSchema.optional(),
  deadline: z.string().optional(),
  internalNote: z.string().optional(),
  patientMessage: z.string().optional(),
  formSeriesId: z.string().optional(),
  bookings: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        role: RoleSchema.optional(),
        scheduledAt: z.string().datetime(),
        status: z.enum(['PENDING', 'SCHEDULED', 'CANCELLED']).default('PENDING'),
        note: z.string().optional(),
        createdByUserId: z.string(),
        createdAt: z.string().datetime(),
      }),
    )
    .optional(),
  reviews: z.array(ClinicalReviewSchema).default([]),
  scheduledAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})
export type Case = z.infer<typeof CaseSchema>

export const TriageInputSchema = z.object({
  nextStep: NextStepSchema,
  deadline: z.string().optional(),
  internalNote: z.string().optional(),
  patientMessage: z.string().optional(),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  closeImmediately: z.boolean().default(false),
})
export type TriageInput = z.infer<typeof TriageInputSchema>
