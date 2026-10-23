import type { BookingRole, Case, CaseCategory, CaseStatus, Role, TriageInput } from '../schemas'
import { getStore, setStore } from '../storage'
import { getEffectiveSteps } from './journeyResolver'
import { getPendingReviews } from './reviews'
import { assignmentModeToAssignedRole, triageDecisionToNextStep } from './triageDecision'
import { addAuditEvent, normalizeIsoDateTime, now, uuid } from './utils'

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
  // Journey startDate is a YYYY-MM-DD (UTC midnight), so compare against today's
  // calendar date at UTC midnight — not local midnight — to keep whole-day arithmetic exact.
  const now = new Date()
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const priority: Record<CaseCategory, number> = { ACUTE: 0, SUBACUTE: 1, CONTROL: 2 }
  const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  return state.cases.map((c) => {
    // Prefer the active journey of the case's own episode (a patient may have several
    // concurrent episodes, e.g. a 1-year control and a new fracture); fall back to the
    // patient's newest active journey for legacy cases without an episode.
    const active = state.patientJourneys.filter(
      (j) => j.patientId === c.patientId && j.status === 'ACTIVE',
    )
    const journey =
      (c.episodeId
        ? active.filter((j) => j.episodeId === c.episodeId).sort(byNewest)[0]
        : undefined) ?? active.sort(byNewest)[0]

    if (!journey) return { ...c, activeCategory: c.category }

    let best: CaseCategory | null = null
    for (const step of getEffectiveSteps(journey.id)) {
      // scheduledDate already includes pause shifts and, for recurring steps,
      // the occurrence's own date (offsetDays is the base entry's offset).
      const stepMs = new Date(step.scheduledDate).getTime()
      const windowStart = stepMs - step.windowDays * 86_400_000
      const windowEnd = stepMs + step.windowDays * 86_400_000
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
  // A single named person owns the task directly; several people or a team leave it claimable.
  const namedIds = input.triageDecision.assignedUserIds ?? []
  const assignedUserId =
    input.triageDecision.assignedUserId ??
    input.assignedUserId ??
    (input.triageDecision.assignmentMode === 'NAMED' && namedIds.length === 1
      ? namedIds[0]
      : undefined)

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
    assignedUserIds: input.triageDecision.assignedUserIds,
    assignedTeamIds: input.triageDecision.assignedTeamIds,
    nextStep: derivedNextStep,
    deadline,
    internalNote: note,
    assignedRole: derivedAssignedRole,
  })
  setStore(state)
  const mode = input.triageDecision.contactMode
  if (input.triageDecision.handledNow && mode === 'PHONE') {
    if (input.triageDecision.callOutcome === 'NOT_REACHED') {
      // The call did not get through: log the attempt and keep the case open with the
      // follow-up task the clinician chose (call again, await the patient's call, hand over).
      state = addAuditEvent(getStore(), caseId, userId, userRole, 'CALL_ATTEMPT', {
        plan: input.triageDecision.notReachedPlan,
        note,
      })
      setStore(state)
      return updated
    }
    // The clinician reached the patient: log the call with its note and close the case
    // in the same step, so no worklist task is created.
    state = addAuditEvent(getStore(), caseId, userId, userRole, 'CONTACTED', { note })
    setStore(state)
    return completeWorklistCase(caseId, userId, userRole, {
      completionComment: note ?? undefined,
    })
  }
  if (input.triageDecision.handledNow && mode === 'DIGITAL') {
    // The clinician replies in the app right away: the message is the contact; close the case.
    state = addAuditEvent(getStore(), caseId, userId, userRole, 'CONTACTED')
    setStore(state)
    return completeWorklistCase(caseId, userId, userRole, {
      completionComment: note ?? undefined,
    })
  }
  return updated
}

const CATEGORY_ORDER: Record<CaseCategory, number> = { ACUTE: 0, SUBACUTE: 1, CONTROL: 2 }

/** Cases waiting for a triage decision, in dashboard order: Akut first, longest wait first. */
export function getReviewQueue(): CaseWithActiveCategory[] {
  return getCasesForDashboard()
    .filter((c) => c.status === 'NEEDS_REVIEW')
    .sort((a, b) => {
      const byCategory =
        CATEGORY_ORDER[a.activeCategory ?? a.category] -
        CATEGORY_ORDER[b.activeCategory ?? b.category]
      if (byCategory !== 0) return byCategory
      return a.scheduledAt.localeCompare(b.scheduledAt)
    })
}

export interface NextCaseToReview {
  /** The next case in the review queue, or null when the queue is empty. */
  next: {
    id: string
    patientId: string
    patientName: string
    category: CaseCategory
    scheduledAt: string
  } | null
  /** Cases left in the queue, excluding the current one. */
  remaining: number
}

/** What to open after finishing `currentCaseId` ("Gå till nästa"). */
export function getNextCaseToReview(currentCaseId: string): NextCaseToReview {
  const queue = getReviewQueue().filter((c) => c.id !== currentCaseId)
  const first = queue[0]
  if (!first) return { next: null, remaining: 0 }
  const patient = getStore().patients.find((p) => p.id === first.patientId)
  return {
    next: {
      id: first.id,
      patientId: first.patientId,
      patientName: patient?.displayName ?? first.patientId,
      category: first.activeCategory ?? first.category,
      scheduledAt: first.scheduledAt,
    },
    remaining: queue.length,
  }
}

export function createBooking(
  caseId: string,
  booking: {
    id: string
    type: string
    role?: BookingRole
    scheduledAt: string
    location?: string
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
    /** Radiograph booked ahead of the follow-up visit. */
    xray?: { scheduledAt: string; location: string }
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
  if (options?.xray) {
    bookings = [
      ...bookings,
      {
        id: uuid(),
        type: 'XRAY',
        scheduledAt: options.xray.scheduledAt,
        location: options.xray.location,
        status: 'SCHEDULED',
        completedAt: null,
        completedByUserId: null,
        followUpDate: null,
        completionComment: null,
        createdByUserId: userId,
        createdAt: completedAt,
      },
    ]
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
    xrayAt: options?.xray?.scheduledAt,
    xrayLocation: options?.xray?.location,
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
