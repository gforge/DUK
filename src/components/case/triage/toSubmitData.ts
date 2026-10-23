import type { AssignmentMode, CareRole, ContactMode } from '@/api/schemas'

import { isHandledNow, type TriageForm } from './schema'
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
  }
  patientMessage?: string
}

/** Who performs a "calling now" phone contact: the triaging clinician. */
export interface HandledBy {
  userId: string
  careRole: Exclude<CareRole, null>
}

/**
 * Map validated form values to the triage input. A single named person owns
 * the task (assignedUserId); several people or teams leave it claimable.
 */
export function toTriageSubmitData(data: TriageForm, handledBy?: HandledBy): TriageSubmitData {
  const note = data.note?.trim() ? data.note : null
  const patientMessage = data.patientMessage?.trim() ? data.patientMessage : undefined
  const contactMode = data.contactMode as ContactMode

  if (isHandledNow(data)) {
    if (!handledBy) throw new Error('handledBy is required when the clinician calls now')
    return {
      triageDecision: {
        contactMode: 'PHONE',
        careRole: handledBy.careRole,
        assignmentMode: 'NAMED',
        assignedUserId: handledBy.userId,
        assignedUserIds: [handledBy.userId],
        dueAt: new Date().toISOString(),
        note,
        handledNow: true,
      },
      patientMessage,
    }
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
  return {
    triageDecision: {
      contactMode,
      careRole: data.careRole,
      assignmentMode: mode,
      assignedUserId: userIds.length === 1 ? userIds[0] : null,
      ...(mode === 'NAMED' ? { assignedUserIds: userIds } : {}),
      ...(mode === 'TEAM' ? { assignedTeamIds: data.assignedTeamIds } : {}),
      dueAt: computeDueAtFromInput(data.dueAtInput),
      note,
      ...(contactMode === 'VISIT' && data.xrayBeforeVisit ? { xrayBeforeVisit: true } : {}),
    },
    patientMessage,
  }
}

/** Number of required choices still missing (drives the "N obligatoriska val kvar" hint). */
export function countMissingRequired(v: Partial<TriageForm>): number {
  if (!v.contactMode)
    return 4 - [v.careRole, hasAssignee(v), v.dueAtInput?.trim()].filter(Boolean).length
  if (v.contactMode === 'CLOSE' || isHandledNow(v)) return 0
  return [v.careRole, hasAssignee(v), v.dueAtInput?.trim()].filter((x) => !x).length
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
