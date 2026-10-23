import type { AssignmentMode, CareRole, ContactMode } from '@/api/schemas'

import {
  isCallingNow,
  isHandingOver,
  isReplyingNow,
  needsPlanningFields,
  type TriageForm,
} from './schema'
import { computeDueAtFromInput } from './utils'

export interface TriageSubmitData {
  triageDecision: {
    contactMode: ContactMode
    careRole: CareRole
    assignmentMode: AssignmentMode
    assignedUserId?: string | null
    assignedUserIds?: string[]
    assignedTeamIds?: string[]
    dueAt?: string | null
    note?: string | null
    xrayBeforeVisit?: boolean
    handledNow?: boolean
    callOutcome?: 'REACHED' | 'NOT_REACHED'
    notReachedPlan?: 'CALL_AGAIN' | 'ASK_PATIENT_TO_CALL' | 'HAND_OVER'
  }
  patientMessage?: string
}

/** Who performs a "calling now" / "replying now" contact: the triaging clinician. */
export interface HandledBy {
  userId: string
  careRole: Exclude<CareRole, null>
}

/** Default due time when the patient is asked to call back: tomorrow at 09:00. */
export function tomorrowMorning(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/**
 * Map validated form values to the triage input. A single named person owns
 * the task (assignedUserId); several people or teams leave it claimable.
 */
export function toTriageSubmitData(data: TriageForm, handledBy?: HandledBy): TriageSubmitData {
  const note = data.note?.trim() ? data.note : null
  const patientMessage = data.patientMessage?.trim() ? data.patientMessage : undefined
  const contactMode = data.contactMode as ContactMode

  if (isReplyingNow(data)) {
    const self = requireSelf(handledBy)
    return {
      triageDecision: {
        contactMode: 'DIGITAL',
        ...self,
        dueAt: new Date().toISOString(),
        note,
        handledNow: true,
      },
      patientMessage,
    }
  }

  if (isCallingNow(data)) {
    const callNote = data.callNote?.trim() ? data.callNote : note
    if (data.callOutcome === 'REACHED') {
      return {
        triageDecision: {
          contactMode: 'PHONE',
          ...requireSelf(handledBy),
          dueAt: new Date().toISOString(),
          note: callNote,
          handledNow: true,
          callOutcome: 'REACHED',
        },
        patientMessage,
      }
    }
    if (data.notReachedPlan === 'CALL_AGAIN') {
      return {
        triageDecision: {
          contactMode: 'PHONE',
          ...requireSelf(handledBy),
          dueAt: computeDueAtFromInput(data.dueAtInput),
          note: callNote,
          handledNow: true,
          callOutcome: 'NOT_REACHED',
          notReachedPlan: 'CALL_AGAIN',
        },
        patientMessage,
      }
    }
    if (data.notReachedPlan === 'ASK_PATIENT_TO_CALL') {
      return {
        triageDecision: {
          contactMode: 'PHONE',
          ...requireSelf(handledBy),
          dueAt: tomorrowMorning(),
          note: callNote,
          handledNow: true,
          callOutcome: 'NOT_REACHED',
          notReachedPlan: 'ASK_PATIENT_TO_CALL',
        },
        patientMessage,
      }
    }
    // HAND_OVER falls through to the planned assignment below.
  }

  if (contactMode === 'CLOSE') {
    return {
      triageDecision: {
        contactMode,
        careRole: null,
        assignmentMode: null,
        assignedUserId: null,
        dueAt: null,
        note,
      },
      patientMessage,
    }
  }

  const mode = data.assignmentMode
  const userIds = mode === 'NAMED' ? data.assignedUserIds : []
  const handingOver = isHandingOver(data)
  return {
    triageDecision: {
      contactMode,
      careRole: data.careRole,
      assignmentMode: mode,
      assignedUserId: userIds.length === 1 ? userIds[0] : null,
      ...(mode === 'NAMED' ? { assignedUserIds: userIds } : {}),
      ...(mode === 'TEAM' ? { assignedTeamIds: data.assignedTeamIds } : {}),
      dueAt: computeDueAtFromInput(data.dueAtInput),
      note: handingOver && data.callNote?.trim() ? data.callNote : note,
      ...(contactMode === 'VISIT' && data.xrayBeforeVisit ? { xrayBeforeVisit: true } : {}),
      ...(handingOver
        ? {
            handledNow: true,
            callOutcome: 'NOT_REACHED' as const,
            notReachedPlan: 'HAND_OVER' as const,
          }
        : {}),
    },
    patientMessage,
  }
}

function requireSelf(handledBy?: HandledBy) {
  if (!handledBy) throw new Error('handledBy is required when the clinician handles it now')
  return {
    careRole: handledBy.careRole,
    assignmentMode: 'NAMED' as const,
    assignedUserId: handledBy.userId,
    assignedUserIds: [handledBy.userId],
  }
}

/** Required choices the clinician has not made yet, in form order. */
export type MissingField =
  | 'contactMode'
  | 'callOutcome'
  | 'callNote'
  | 'notReachedPlan'
  | 'retryAt'
  | 'patientMessage'
  | 'careRole'
  | 'assignee'
  | 'dueAt'

export function missingRequired(v: Partial<TriageForm>): MissingField[] {
  const planning = (): MissingField[] => [
    ...(v.careRole ? [] : ['careRole' as const]),
    ...(hasAssignee(v) ? [] : ['assignee' as const]),
    ...(v.dueAtInput?.trim() ? [] : ['dueAt' as const]),
  ]
  if (!v.contactMode) return ['contactMode', ...planning()]
  if (v.contactMode === 'CLOSE') return []
  if (isReplyingNow(v)) return v.patientMessage?.trim() ? [] : ['patientMessage']
  if (isCallingNow(v)) {
    if (!v.callOutcome) return ['callOutcome']
    if (v.callOutcome === 'REACHED') return v.callNote?.trim() ? [] : ['callNote']
    if (!v.notReachedPlan) return ['notReachedPlan']
    if (v.notReachedPlan === 'CALL_AGAIN') return v.dueAtInput?.trim() ? [] : ['retryAt']
    if (v.notReachedPlan === 'ASK_PATIENT_TO_CALL')
      return v.patientMessage?.trim() ? [] : ['patientMessage']
  }
  return needsPlanningFields(v) ? planning() : []
}

/** Number of required choices still missing. */
export function countMissingRequired(v: Partial<TriageForm>): number {
  return missingRequired(v).length
}

export function hasAssignee(v: Partial<TriageForm>): boolean {
  switch (v.assignmentMode) {
    case 'ANY':
      return true
    case 'PAL':
      return v.careRole === 'DOCTOR'
    case 'NAMED':
      return (v.assignedUserIds?.length ?? 0) > 0
    case 'TEAM':
      return (v.assignedTeamIds?.length ?? 0) > 0
    default:
      return false
  }
}
