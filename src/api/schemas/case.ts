import { z } from 'zod'

import {
  AssignmentModeSchema,
  CareRoleSchema,
  CaseCategorySchema,
  CaseStatusSchema,
  ContactModeSchema,
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
  /** The EpisodeOfCare this case is associated with. */
  episodeId: z.string().optional(),
  category: CaseCategorySchema,
  status: CaseStatusSchema,
  triggers: z.array(TriggerTypeSchema),
  policyWarnings: z.array(PolicyWarningSchema),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  createdByUserId: z.string(),
  triagedByUserId: z.string().optional(),
  nextStep: NextStepSchema.optional(),
  triageDecision: z
    .object({
      contactMode: ContactModeSchema,
      careRole: CareRoleSchema,
      assignmentMode: AssignmentModeSchema,
      assignedUserId: z.string().nullable().optional(),
      dueAt: z.string().datetime().nullable().optional(),
      note: z.string().nullable().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.contactMode === 'CLOSE') {
        if (value.careRole !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['careRole'],
            message: 'careRole must be null for CLOSE',
          })
        }
        if (value.assignmentMode !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['assignmentMode'],
            message: 'assignmentMode must be null for CLOSE',
          })
        }
      }

      if (value.assignmentMode === 'PAL' && value.careRole !== 'DOCTOR') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['assignmentMode'],
          message: 'PAL is only valid when careRole is DOCTOR',
        })
      }

      if (value.assignmentMode === 'NAMED') {
        if (!value.careRole) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['careRole'],
            message: 'careRole is required for NAMED',
          })
        }
        if (!value.assignedUserId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['assignedUserId'],
            message: 'assignedUserId is required for NAMED',
          })
        }
      }

      if (value.assignmentMode !== 'NAMED' && value.assignedUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['assignedUserId'],
          message: 'assignedUserId is only valid for NAMED',
        })
      }
    })
    .optional(),
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
        status: z.enum(['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
        completedAt: z.string().datetime().nullable().optional(),
        completedByUserId: z.string().nullable().optional(),
        followUpDate: z.string().datetime().nullable().optional(),
        completionComment: z.string().nullable().optional(),
        note: z.string().optional(),
        createdByUserId: z.string(),
        createdAt: z.string().datetime(),
      }),
    )
    .optional(),
  reviews: z.array(ClinicalReviewSchema).default([]),
  scheduledAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
})
export type Case = z.infer<typeof CaseSchema>

export const TriageDecisionSchema = z
  .object({
    contactMode: ContactModeSchema,
    careRole: CareRoleSchema,
    assignmentMode: AssignmentModeSchema,
    assignedUserId: z.string().nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contactMode === 'CLOSE') {
      if (value.careRole !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['careRole'],
          message: 'careRole must be null for CLOSE',
        })
      }
      if (value.assignmentMode !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['assignmentMode'],
          message: 'assignmentMode must be null for CLOSE',
        })
      }
    }
    if (value.assignmentMode === 'PAL' && value.careRole !== 'DOCTOR') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assignmentMode'],
        message: 'PAL is only valid when careRole is DOCTOR',
      })
    }
    if (value.assignmentMode === 'NAMED' && !value.assignedUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assignedUserId'],
        message: 'assignedUserId is required for NAMED',
      })
    }
    if (value.assignmentMode !== 'NAMED' && value.assignedUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assignedUserId'],
        message: 'assignedUserId is only valid for NAMED',
      })
    }
  })
export type TriageDecision = z.infer<typeof TriageDecisionSchema>

export const TriageInputSchema = z.object({
  triageDecision: TriageDecisionSchema,
  // Legacy compatibility fields (kept optional during transition period).
  nextStep: NextStepSchema.optional(),
  deadline: z.string().optional(),
  internalNote: z.string().optional(),
  patientMessage: z.string().optional(),
  assignedRole: RoleSchema.optional(),
  assignedUserId: z.string().optional(),
  closeImmediately: z.boolean().optional(),
})
export type TriageInput = z.infer<typeof TriageInputSchema>
