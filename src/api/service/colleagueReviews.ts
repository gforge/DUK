import type { Case, Role } from '../schemas'
import { getStore, setStore } from '../storage'
import { addAuditEvent, now, uuid } from './utils'

function updateCase(
  caseId: string,
  fn: (c: Case) => Case,
): { state: ReturnType<typeof getStore>; updated: Case } {
  const state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error(`Case ${caseId} not found`)
  const updated = fn(existing)
  return {
    state: { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) },
    updated,
  }
}

export function requestColleagueReview(
  caseId: string,
  reviewerUserId: string,
  question: string | null,
  userId: string,
  userRole: Role,
): Case {
  if (reviewerUserId === userId) throw new Error('Cannot request a review from yourself')
  const id = uuid()
  const { state, updated } = updateCase(caseId, (c) => ({
    ...c,
    colleagueReviews: [
      ...c.colleagueReviews,
      {
        id,
        requestedByUserId: userId,
        requestedAt: now(),
        reviewerUserId,
        question: question?.trim() || null,
        respondedAt: null,
        response: null,
      },
    ],
    lastActivityAt: now(),
  }))
  setStore(
    addAuditEvent(state, caseId, userId, userRole, 'COLLEAGUE_REVIEW_REQUESTED', {
      reviewId: id,
      reviewerUserId,
    }),
  )
  return updated
}

export function respondColleagueReview(
  caseId: string,
  reviewId: string,
  response: string,
  userId: string,
  userRole: Role,
): Case {
  const { state, updated } = updateCase(caseId, (c) => {
    const review = c.colleagueReviews.find((r) => r.id === reviewId)
    if (!review) throw new Error(`Colleague review ${reviewId} not found`)
    if (review.reviewerUserId !== userId)
      throw new Error('Only the requested colleague can respond')
    if (review.respondedAt) throw new Error('Colleague review already answered')
    return {
      ...c,
      colleagueReviews: c.colleagueReviews.map((r) =>
        r.id === reviewId ? { ...r, respondedAt: now(), response: response.trim() } : r,
      ),
      lastActivityAt: now(),
    }
  })
  setStore(
    addAuditEvent(state, caseId, userId, userRole, 'COLLEAGUE_REVIEW_ANSWERED', { reviewId }),
  )
  return updated
}

export function cancelColleagueReview(
  caseId: string,
  reviewId: string,
  userId: string,
  userRole: Role,
): Case {
  const { state, updated } = updateCase(caseId, (c) => {
    const review = c.colleagueReviews.find((r) => r.id === reviewId)
    if (!review) throw new Error(`Colleague review ${reviewId} not found`)
    if (review.requestedByUserId !== userId) throw new Error('Only the requester can cancel')
    return { ...c, colleagueReviews: c.colleagueReviews.filter((r) => r.id !== reviewId) }
  })
  setStore(
    addAuditEvent(state, caseId, userId, userRole, 'COLLEAGUE_REVIEW_CANCELLED', { reviewId }),
  )
  return updated
}
