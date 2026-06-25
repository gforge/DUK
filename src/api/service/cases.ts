import type { BookingRole, Case, CaseCategory, CaseStatus, Role, TriageInput } from '../schemas'
import { getStore, setStore } from '../storage'
import { getEffectiveSteps } from './journeyResolver'
import { getPendingReviews } from './reviews'
import { assignmentModeToAssignedRole, triageDecisionToNextStep } from './triageDecision'
import { addAuditEvent, normalizeIsoDateTime, now } from './utils'

export type CaseWithActiveCategory = Case & {
  /** null = between phases (not in any step window today) */
  activeCategory: CaseCategory | null
}

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  // NEW → NEEDS_REVIEW: patient opened app and submitted feedback
  // NEW → TRIAGED / CLOSED: clinician acts directly (patient never opened app)
  NEW: ['NEEDS_REVIEW', 'TRIAGED', 'CLOSED'],
  NEEDS_REVIEW: ['TRIAGED', 'CLOSED'],
  TRIAGED: ['FOLLOWING_UP', 'CLOSED'],
  FOLLOWING_UP: ['CLOSED'],
  CLOSED: [],
}

export function getCases(): Case[] {
  return getStore().cases
}

export function getCase(id: string): Case | undefined {
  return getStore().cases.find((c) => c.id === id)
}

export function getCasesForDashboard(): CaseWithActiveCategory[] {
  const state = getStore()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const priority: Record<CaseCategory, number> = { ACUTE: 0, SUBACUTE: 1, CONTROL: 2 }

  return state.cases.map((c) => {
    const journey = state.patientJourneys
      .filter((j) => j.patientId === c.patientId && j.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!journey) return { ...c, activeCategory: c.category }

    const startMs = new Date(journey.startDate).getTime()
    let best: CaseCategory | null = null
    for (const step of getEffectiveSteps(journey.id)) {
      const windowStart = startMs + (step.offsetDays - step.windowDays) * 86_400_000
      const windowEnd = startMs + (step.offsetDays + step.windowDays) * 86_400_000
      if (todayMs >= windowStart && todayMs <= windowEnd) {
        const cat = step.dashboardCategory ?? c.category
        if (best === null || priority[cat] < priority[best]) best = cat
      }
    }
    return { ...c, activeCategory: best }
  })
}

export function triageCase(
  caseId: string,
  input: TriageInput,
  userId: string,
  userRole: Role,
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)

  const nextStatus: CaseStatus = input.triageDecision.contactMode === 'CLOSE' ? 'CLOSED' : 'TRIAGED'

  // Prevent triage when there are any unreviewed lab/xray results
  const pending = getPendingReviews(caseId)
  if (pending.length > 0) {
    throw new Error('Cannot triage while clinical reviews are pending')
  }

  if (!VALID_TRANSITIONS[existing.status]?.includes(nextStatus))
    throw new Error(`Invalid transition: ${existing.status} → ${nextStatus}`)

  const derivedNextStep = triageDecisionToNextStep(input.triageDecision)
  const derivedAssignedRole = assignmentModeToAssignedRole(
    input.triageDecision.assignmentMode,
    input.triageDecision.careRole,
  )
  const note = input.triageDecision.note ?? input.internalNote

  // Normalize any date-only dueAt or deadline values to a full ISO timestamp.
  // This guards against the UI accidentally passing "YYYY-MM-DD" strings.
  const rawDueAt = input.triageDecision.dueAt ?? input.deadline
  const dueAt = normalizeIsoDateTime(rawDueAt) ?? null

  const deadline: string | undefined = dueAt ?? undefined
  const assignedUserId = input.triageDecision.assignedUserId ?? input.assignedUserId

  const updated: Case = {
    ...existing,
    status: nextStatus,
    triageDecision: input.triageDecision,
    nextStep: derivedNextStep,
    deadline,
    internalNote: note,
    patientMessage: input.patientMessage,
    assignedRole: derivedAssignedRole,
    assignedUserId: assignedUserId ?? undefined,
    triagedByUserId: userId,
    lastActivityAt: now(),
    closedAt: nextStatus === 'CLOSED' ? now() : (existing.closedAt ?? null),
  }
  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'TRIAGED', {
    from: existing.status,
    to: nextStatus,
    contactMode: input.triageDecision.contactMode,
    careRole: input.triageDecision.careRole,
    assignmentMode: input.triageDecision.assignmentMode,
    nextStep: derivedNextStep,
    deadline,
    internalNote: note,
    assignedRole: derivedAssignedRole,
  })
  setStore(state)
  return updated
}

export function createBooking(
  caseId: string,
  booking: {
    id: string
    type: string
    role?: BookingRole
    scheduledAt: string
    note?: string
    createdByUserId: string
    createdAt: string
  },
  userId: string,
  userRole: Role,
): Case {
  // Ensure booking has a status
  const bookingWithStatus = {
    ...booking,
    status: (booking as any).status ?? ('PENDING' as const),
    completedAt: null,
    completedByUserId: null,
    followUpDate: null,
    completionComment: null,
  }
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)

  const updated: Case = {
    ...existing,
    bookings: [...(existing.bookings ?? []), bookingWithStatus as any],
    lastActivityAt: now(),
  }
  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'BOOKING_CREATED', {
    bookingId: booking.id,
    scheduledAt: booking.scheduledAt,
    role: booking.role,
  })
  setStore(state)
  return updated
}

export function updateBooking(
  caseId: string,
  bookingId: string,
  patch: {
    scheduledAt?: string
    role?: BookingRole | undefined
    note?: string | undefined
    status?: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    completedAt?: string | null
    completedByUserId?: string | null
    followUpDate?: string | null
    completionComment?: string | null
  },
  userId: string,
  userRole: Role,
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)

  const bookings = (existing.bookings ?? []).map((b) =>
    b.id === bookingId ? { ...b, ...patch } : b,
  )

  const updated: Case = {
    ...existing,
    bookings,
    lastActivityAt: now(),
  }
  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'BOOKING_UPDATED', {
    bookingId,
    patch,
  })
  setStore(state)
  return updated
}

export function cancelBooking(
  caseId: string,
  bookingId: string,
  userId: string,
  userRole: Role,
): Case {
  return updateBooking(caseId, bookingId, { status: 'CANCELLED' }, userId, userRole)
}

export function advanceCaseStatus(
  caseId: string,
  toStatus: CaseStatus,
  userId: string,
  userRole: Role,
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)
  if (!VALID_TRANSITIONS[existing.status]?.includes(toStatus))
    throw new Error(`Invalid transition: ${existing.status} → ${toStatus}`)

  const changedAt = now()
  const updated: Case = {
    ...existing,
    status: toStatus,
    lastActivityAt: changedAt,
    closedAt: toStatus === 'CLOSED' ? changedAt : existing.closedAt,
  }
  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'STATUS_CHANGED', {
    from: existing.status,
    to: toStatus,
  })
  setStore(state)
  return updated
}

export function completeWorklistCase(
  caseId: string,
  userId: string,
  userRole: Role,
  options?: {
    bookingId?: string
    followUpDate?: string
    completedAt?: string
    completionComment?: string
  },
): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)
  if (!VALID_TRANSITIONS[existing.status]?.includes('CLOSED')) {
    throw new Error(`Invalid transition: ${existing.status} → CLOSED`)
  }

  const completedAt = options?.completedAt ?? now()
  let bookings = existing.bookings ?? []
  if (options?.bookingId) {
    let found = false
    bookings = bookings.map((booking) => {
      if (booking.id !== options.bookingId) return booking
      found = true
      return {
        ...booking,
        status: 'COMPLETED',
        completedAt,
        completedByUserId: userId,
        followUpDate: options.followUpDate ?? null,
        completionComment: options.completionComment ?? null,
      }
    })
    if (!found) throw new Error(`Booking ${options.bookingId} not found for case ${caseId}`)
  }

  const updated: Case = {
    ...existing,
    status: 'CLOSED',
    bookings,
    closedAt: completedAt,
    lastActivityAt: completedAt,
  }

  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'STATUS_CHANGED', {
    from: existing.status,
    to: 'CLOSED',
    closedAt: completedAt,
    bookingId: options?.bookingId,
    followUpDate: options?.followUpDate,
    completionComment: options?.completionComment,
  })
  setStore(state)
  return updated
}

export function claimCaseAssignment(caseId: string, userId: string, userRole: Role): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)
  if (existing.status !== 'TRIAGED' && existing.status !== 'FOLLOWING_UP') {
    throw new Error('Only active worklist cases can be claimed')
  }

  const updated: Case = {
    ...existing,
    assignedUserId: userId,
    lastActivityAt: now(),
  }

  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, userId, userRole, 'STATUS_CHANGED', {
    action: 'CLAIMED',
    assignedUserId: userId,
  })
  setStore(state)
  return updated
}
