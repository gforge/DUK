import { z } from 'zod'

import { parseDeadlineInput } from './parseDeadlineInput'

const ContactModeSchema = z.enum(['DIGITAL', 'PHONE', 'VISIT', 'CLOSE']).nullable()
const CareRoleSchema = z.enum(['DOCTOR', 'NURSE', 'PHYSIO']).nullable()
const AssignmentModeSchema = z.enum(['ANY', 'PAL', 'NAMED', 'TEAM']).nullable()

export const PATIENT_MESSAGE_MAX = 500

export const TriageFormSchema = z
  .object({
    contactMode: ContactModeSchema,
    careRole: CareRoleSchema,
    assignmentMode: AssignmentModeSchema,
    /** NAMED: one or more people. */
    assignedUserIds: z.array(z.string()),
    /** TEAM: one or more care teams. */
    assignedTeamIds: z.array(z.string()),
    dueAtInput: z.string().optional(),
    note: z.string().optional(),
    patientMessage: z.string().max(PATIENT_MESSAGE_MAX).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.contactMode) {
      ctx.addIssue({
        code: 'custom',
        path: ['contactMode'],
        message: 'contactMode is required',
      })
      return
    }

    if (value.dueAtInput?.trim()) {
      const parsed = parseDeadlineInput(value.dueAtInput)
      const date = new Date(value.dueAtInput)
      if (!parsed && Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: 'custom',
          path: ['dueAtInput'],
          message: 'dueAtInput is invalid',
        })
      }
    }

    if (value.contactMode === 'CLOSE') return

    if (!value.careRole) {
      ctx.addIssue({
        code: 'custom',
        path: ['careRole'],
        message: 'careRole is required',
      })
    }

    if (!value.assignmentMode) {
      ctx.addIssue({
        code: 'custom',
        path: ['assignmentMode'],
        message: 'assignmentMode is required',
      })
    }

    if (value.assignmentMode === 'PAL' && value.careRole !== 'DOCTOR') {
      ctx.addIssue({
        code: 'custom',
        path: ['assignmentMode'],
        message: 'PAL only valid for doctor',
      })
    }

    if (value.assignmentMode === 'NAMED' && value.assignedUserIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['assignedUserIds'],
        message: 'Pick at least one person for NAMED',
      })
    }

    if (value.assignmentMode === 'TEAM' && value.assignedTeamIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['assignedTeamIds'],
        message: 'Pick at least one team for TEAM',
      })
    }

    if (!value.dueAtInput?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueAtInput'],
        message: 'dueAtInput is required',
      })
    }
  })

export type TriageForm = z.infer<typeof TriageFormSchema>
