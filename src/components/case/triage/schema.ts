import { z } from 'zod'

import { parseDeadlineInput } from './parseDeadlineInput'

const ContactModeSchema = z.enum(['DIGITAL', 'PHONE', 'VISIT', 'CLOSE']).nullable()
const CareRoleSchema = z.enum(['DOCTOR', 'NURSE', 'PHYSIO']).nullable()
const AssignmentModeSchema = z.enum(['ANY', 'PAL', 'NAMED']).nullable()

export const TriageFormSchema = z
  .object({
    contactMode: ContactModeSchema,
    careRole: CareRoleSchema,
    assignmentMode: AssignmentModeSchema,
    assignedUserId: z.string().optional(),
    dueAtInput: z.string().optional(),
    note: z.string().optional(),
    patientMessage: z.string().optional(),
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

    if (value.assignmentMode === 'NAMED' && !value.assignedUserId) {
      ctx.addIssue({
        code: 'custom',
        path: ['assignedUserId'],
        message: 'Pick a person for NAMED',
      })
    }
  })

export type TriageForm = z.infer<typeof TriageFormSchema>
