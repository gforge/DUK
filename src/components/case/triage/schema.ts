import { z } from 'zod'

import { parseDeadlineInput } from './parseDeadlineInput'

const ContactModeSchema = z.enum(['DIGITAL', 'PHONE', 'VISIT', 'CLOSE']).nullable()
const CareRoleSchema = z.enum(['DOCTOR', 'NURSE', 'PHYSIO']).nullable()
const AssignmentModeSchema = z.enum(['ANY', 'PAL', 'NAMED', 'TEAM']).nullable()
const CallOutcomeSchema = z.enum(['REACHED', 'NOT_REACHED']).nullable()
const NotReachedPlanSchema = z.enum(['CALL_AGAIN', 'ASK_PATIENT_TO_CALL', 'HAND_OVER']).nullable()

export const PATIENT_MESSAGE_MAX = 500
export const CALL_NOTE_MAX = 1000

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
    /** VISIT only: book a radiograph before the follow-up visit. */
    xrayBeforeVisit: z.boolean().optional(),
    /**
     * Step 2 "När och av vem?": the clinician handles the contact right now (PHONE: calls,
     * DIGITAL: replies in the app) instead of planning a task for someone.
     */
    handledNow: z.boolean().optional(),
    /** PHONE + handledNow: did the call get through? */
    callOutcome: CallOutcomeSchema.optional(),
    /** PHONE + handledNow + REACHED: what was said; logged and suggested as journal text. */
    callNote: z.string().max(CALL_NOTE_MAX).optional(),
    /** PHONE + handledNow + NOT_REACHED: how the case continues. */
    notReachedPlan: NotReachedPlanSchema.optional(),
    patientMessage: z.string().max(PATIENT_MESSAGE_MAX).optional(),
  })
  .superRefine((value, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    if (!value.contactMode) {
      issue('contactMode', 'contactMode is required')
      return
    }

    if (value.dueAtInput?.trim()) {
      const parsed = parseDeadlineInput(value.dueAtInput)
      const date = new Date(value.dueAtInput)
      if (!parsed && Number.isNaN(date.getTime())) issue('dueAtInput', 'dueAtInput is invalid')
    }

    if (value.contactMode === 'CLOSE') return

    if (isReplyingNow(value)) {
      if (!value.patientMessage?.trim()) issue('patientMessage', 'patientMessage is required')
      return
    }

    if (isCallingNow(value)) {
      if (!value.callOutcome) {
        issue('callOutcome', 'callOutcome is required')
        return
      }
      if (value.callOutcome === 'REACHED') {
        if (!value.callNote?.trim()) issue('callNote', 'callNote is required')
        return
      }
      if (!value.notReachedPlan) {
        issue('notReachedPlan', 'notReachedPlan is required')
        return
      }
      if (value.notReachedPlan === 'CALL_AGAIN') {
        if (!value.dueAtInput?.trim()) issue('dueAtInput', 'retry time is required')
        return
      }
      if (value.notReachedPlan === 'ASK_PATIENT_TO_CALL') {
        if (!value.patientMessage?.trim()) issue('patientMessage', 'patientMessage is required')
        return
      }
      // HAND_OVER: the ordinary competence / assignee / due date rules below apply.
    }

    if (!value.careRole) issue('careRole', 'careRole is required')
    if (!value.assignmentMode) issue('assignmentMode', 'assignmentMode is required')
    if (value.assignmentMode === 'PAL' && value.careRole !== 'DOCTOR')
      issue('assignmentMode', 'PAL only valid for doctor')
    if (value.assignmentMode === 'NAMED' && value.assignedUserIds.length === 0)
      issue('assignedUserIds', 'Pick at least one person for NAMED')
    if (value.assignmentMode === 'TEAM' && value.assignedTeamIds.length === 0)
      issue('assignedTeamIds', 'Pick at least one team for TEAM')
    if (!value.dueAtInput?.trim()) issue('dueAtInput', 'dueAtInput is required')
  })

export type TriageForm = z.infer<typeof TriageFormSchema>

/** True when the clinician handles the contact immediately by phone or in-app reply. */
export const isHandledNow = (v: Partial<TriageForm>): boolean =>
  (v.contactMode === 'PHONE' || v.contactMode === 'DIGITAL') && v.handledNow === true

/** True when the clinician answers the patient in the app right away (no task, case closes). */
export const isReplyingNow = (v: Partial<TriageForm>): boolean =>
  v.contactMode === 'DIGITAL' && v.handledNow === true

/** True when the clinician phones the patient right away. */
export const isCallingNow = (v: Partial<TriageForm>): boolean =>
  v.contactMode === 'PHONE' && v.handledNow === true

/** True when a direct call did not get through and the clinician hands the case to someone. */
export const isHandingOver = (v: Partial<TriageForm>): boolean =>
  isCallingNow(v) && v.callOutcome === 'NOT_REACHED' && v.notReachedPlan === 'HAND_OVER'

/**
 * Whether the ordinary planning fields (competence, assignee, due date) apply: a planned
 * follow-up, a visit, or a direct call handed over to someone else.
 */
export const needsPlanningFields = (v: Partial<TriageForm>): boolean => {
  if (!v.contactMode || v.contactMode === 'CLOSE') return false
  if (!isHandledNow(v)) return true
  return isHandingOver(v)
}
