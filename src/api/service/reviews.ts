import { getStore, patchStore } from '../storage'
import { uuid, now, addAuditEvent } from './utils'
import type { ClinicalReview, ReviewType, Role, TriggerType, ReviewOutcome } from '../schemas'

export function createReview(
  caseId: string,
  type: ReviewType,
  userId: string,
  userRole: Role,
  source: 'JOURNEY' | 'MANUAL' = 'MANUAL',
  initialNote?: string,
  journeyStepLabel?: string,
): ClinicalReview {
  const review: ClinicalReview = {
    id: uuid(),
    type,
    createdAt: now(),
    createdByUserId: userId,
    createdByRole: userRole,
    reviewedAt: null,
    reviewedByUserId: undefined,
    reviewedByRole: undefined,
    note: initialNote ?? null,
    source,
    journeyStepLabel,
  }

  return patchStore((state) => {
    const updated = {
      ...state,
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, reviews: [...(c.reviews ?? []), review] } : c,
      ),
    }
    return addAuditEvent(updated, caseId, userId, userRole, 'REVIEW_CREATED', { type, source })
  })
    .cases.find((c) => c.id === caseId)!
    .reviews.find((r) => r.id === review.id)!
}

export function completeReview(
  reviewId: string,
  caseId: string,
  userId: string,
  userRole: Role,
  outcome: ReviewOutcome,
  note?: string,
): ClinicalReview {
  if ((outcome === 'UNCERTAIN' || outcome === 'PROBLEM') && (!note || !note.trim())) {
    throw new Error('Comment is required for UNCERTAIN and PROBLEM outcomes')
  }
  const review = patchStore((state) => {
    const updated = {
      ...state,
      cases: state.cases.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            reviews: c.reviews.map((r) =>
              r.id === reviewId
                ? {
                    ...r,
                    reviewedAt: now(),
                    reviewedByUserId: userId,
                    reviewedByRole: userRole,
                    outcome,
                    note: note ?? null,
                  }
                : r,
            ),
          }
        }
        return c
      }),
    }
    return addAuditEvent(updated, caseId, userId, userRole, 'REVIEW_COMPLETED', {
      reviewId,
      outcome,
      note,
    })
  })
    .cases.find((c) => c.id === caseId)!
    .reviews.find((r) => r.id === reviewId)!
  updateCaseTriggersForReviews(caseId)
  return review
}

export function deleteReview(reviewId: string, caseId: string): void {
  patchStore((state) => ({
    ...state,
    cases: state.cases.map((c) =>
      c.id === caseId ? { ...c, reviews: c.reviews.filter((r) => r.id !== reviewId) } : c,
    ),
  }))
  updateCaseTriggersForReviews(caseId)
}

export function getPendingReviews(caseId: string): ClinicalReview[] {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)
  if (!caseData) return []
  return caseData.reviews.filter((r) => r.reviewedAt === null)
}

export function getAllReviews(caseId: string): ClinicalReview[] {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)
  if (!caseData) return []
  return caseData.reviews
}

/**
 * Internal helper: update LAB_PENDING and XRAY_PENDING triggers based on pending reviews.
 * This is called automatically after createReview and completeReview.
 */
export function updateCaseTriggersForReviews(caseId: string): void {
  patchStore((state) => {
    const caseData = state.cases.find((c) => c.id === caseId)
    if (!caseData) return state

    const pendingReviews = caseData.reviews.filter((r) => r.reviewedAt === null)
    const hasLabPending = pendingReviews.some((r) => r.type === 'LAB')
    const hasXrayPending = pendingReviews.some((r) => r.type === 'XRAY')

    // Build the new trigger list
    let newTriggers: TriggerType[] = caseData.triggers.filter(
      (t) => t !== 'LAB_PENDING' && t !== 'XRAY_PENDING',
    )
    if (hasLabPending) newTriggers = [...newTriggers, 'LAB_PENDING']
    if (hasXrayPending) newTriggers = [...newTriggers, 'XRAY_PENDING']

    return {
      ...state,
      cases: state.cases.map((c) => (c.id === caseId ? { ...c, triggers: newTriggers } : c)),
    }
  })
}
