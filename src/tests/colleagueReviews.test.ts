import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

const CASE_ID = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!.id

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

function request(question: string | null = 'Röntgen behövs?') {
  const updated = service.requestColleagueReview(
    CASE_ID,
    'user-pal-1',
    question,
    'user-nurse-1',
    'NURSE',
  )
  return updated.colleagueReviews[updated.colleagueReviews.length - 1]
}

describe('colleague reviews', () => {
  it('requests a review and logs an audit event', () => {
    const review = request('  Röntgen behövs?  ')
    expect(review).toMatchObject({
      requestedByUserId: 'user-nurse-1',
      reviewerUserId: 'user-pal-1',
      question: 'Röntgen behövs?',
      respondedAt: null,
      response: null,
    })
    const actions = service.getAuditEvents(CASE_ID).map((e) => e.action)
    expect(actions).toContain('COLLEAGUE_REVIEW_REQUESTED')
  })

  it('stores an empty question as null and refuses self-review', () => {
    expect(request('   ').question).toBeNull()
    expect(() =>
      service.requestColleagueReview(CASE_ID, 'user-nurse-1', null, 'user-nurse-1', 'NURSE'),
    ).toThrow(/yourself/)
  })

  it('only the requested reviewer can respond, once', () => {
    const review = request()
    expect(() =>
      service.respondColleagueReview(CASE_ID, review.id, 'Nej', 'user-doc-1', 'DOCTOR'),
    ).toThrow(/Only the requested colleague/)

    const updated = service.respondColleagueReview(
      CASE_ID,
      review.id,
      ' Ja, beställ ',
      'user-pal-1',
      'DOCTOR',
    )
    const answered = updated.colleagueReviews.find((r) => r.id === review.id)!
    expect(answered.response).toBe('Ja, beställ')
    expect(answered.respondedAt).not.toBeNull()
    expect(() =>
      service.respondColleagueReview(CASE_ID, review.id, 'Igen', 'user-pal-1', 'DOCTOR'),
    ).toThrow(/already answered/)
  })

  it('only the requester can withdraw', () => {
    const review = request()
    expect(() => service.cancelColleagueReview(CASE_ID, review.id, 'user-pal-1', 'DOCTOR')).toThrow(
      /Only the requester/,
    )
    const updated = service.cancelColleagueReview(CASE_ID, review.id, 'user-nurse-1', 'NURSE')
    expect(updated.colleagueReviews.find((r) => r.id === review.id)).toBeUndefined()
  })

  it('never blocks triage', () => {
    request()
    const result = service.triageCase(
      CASE_ID,
      { triageDecision: { contactMode: 'PHONE', careRole: 'NURSE', assignmentMode: 'ANY' } },
      'user-nurse-1',
      'NURSE',
    )
    expect(result.status).toBe('TRIAGED')
  })
})
