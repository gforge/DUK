import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('triageCase', () => {
  it('transitions NEEDS_REVIEW → TRIAGED when triaging', () => {
    const reviewCase = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')
    if (!reviewCase) throw new Error('No NEEDS_REVIEW case in seed data')

    const result = service.triageCase(
      reviewCase.id,
      {
        triageDecision: {
          contactMode: 'PHONE',
          careRole: 'NURSE',
          assignmentMode: 'ANY',
          dueAt: new Date().toISOString(),
          note: 'Test note',
        },
        patientMessage: 'Test msg',
      },
      'user-pal-1',
      'DOCTOR',
    )

    expect(result.status).toBe('TRIAGED')
    expect(result.nextStep).toBe('PHONE_CALL')
    expect(result.triageDecision?.contactMode).toBe('PHONE')
    expect(result.internalNote).toBe('Test note')
    expect(result.patientMessage).toBe('Test msg')
  })

  it('blocks triage when pending reviews exist and allows once completed', () => {
    // pick a NEEDS_REVIEW case and create a pending review
    const reviewCase = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')
    if (!reviewCase) throw new Error('No NEEDS_REVIEW case in seed data')

    const newReview = service.createReview(reviewCase.id, 'LAB', 'user-doc-1', 'DOCTOR')
    expect(service.getPendingReviews(reviewCase.id)).toHaveLength(1)

    expect(() =>
      service.triageCase(
        reviewCase.id,
        {
          triageDecision: {
            contactMode: 'PHONE',
            careRole: 'NURSE',
            assignmentMode: 'ANY',
          },
        },
        'user-doc-1',
        'DOCTOR',
      ),
    ).toThrow(/pending/i)

    // complete the review then triage should succeed
    service.completeReview(newReview.id, reviewCase.id, 'user-doc-1', 'DOCTOR', 'OK')
    const result2 = service.triageCase(
      reviewCase.id,
      {
        triageDecision: {
          contactMode: 'PHONE',
          careRole: 'NURSE',
          assignmentMode: 'ANY',
        },
      },
      'user-doc-1',
      'DOCTOR',
    )
    expect(result2.status).toBe('TRIAGED')
  })

  it('sets status to CLOSED when closeImmediately is true', () => {
    const triagedCase = SEED_STATE.cases.find((c) => c.status === 'TRIAGED')
    if (!triagedCase) throw new Error('No TRIAGED case in seed data')

    const result = service.triageCase(
      triagedCase.id,
      {
        triageDecision: {
          contactMode: 'CLOSE',
          careRole: null,
          assignmentMode: null,
        },
      },
      'user-doc-1',
      'DOCTOR',
    )

    expect(result.status).toBe('CLOSED')
  })

  it('allows triaging a NEW case directly to TRIAGED (patient not yet active)', () => {
    const newCase = SEED_STATE.cases.find((c) => c.status === 'NEW')
    if (!newCase) throw new Error('No NEW case in seed data')

    const result = service.triageCase(
      newCase.id,
      {
        triageDecision: {
          contactMode: 'PHONE',
          careRole: 'NURSE',
          assignmentMode: 'ANY',
        },
      },
      'user-doc-1',
      'DOCTOR',
    )
    expect(result.status).toBe('TRIAGED')
  })
})

describe('advanceCaseStatus', () => {
  it('advances TRIAGED → FOLLOWING_UP', () => {
    const triagedCase = SEED_STATE.cases.find((c) => c.status === 'TRIAGED')
    if (!triagedCase) throw new Error('No TRIAGED case in seed data')

    const result = service.advanceCaseStatus(
      triagedCase.id,
      'FOLLOWING_UP',
      'user-nurse-1',
      'NURSE',
    )

    expect(result.status).toBe('FOLLOWING_UP')
  })

  it('allows advancing NEW directly to CLOSED', () => {
    const newCase = SEED_STATE.cases.find((c) => c.status === 'NEW')
    if (!newCase) throw new Error('No NEW case in seed data')

    const result = service.advanceCaseStatus(newCase.id, 'CLOSED', 'user-doc-1', 'DOCTOR')
    expect(result.status).toBe('CLOSED')
  })

  it('throws on genuinely invalid transition (CLOSED → TRIAGED)', () => {
    // Ensure transitions that are semantically impossible still throw
    const closedCase = SEED_STATE.cases.find((c) => c.status === 'CLOSED')
    if (!closedCase) throw new Error('No CLOSED case in seed data')

    expect(() =>
      service.advanceCaseStatus(closedCase.id, 'TRIAGED', 'user-doc-1', 'DOCTOR'),
    ).toThrow()
  })

  it('advances FOLLOWING_UP → CLOSED', () => {
    const followingCase = SEED_STATE.cases.find((c) => c.status === 'FOLLOWING_UP')
    if (!followingCase) throw new Error('No FOLLOWING_UP case in seed data')

    const result = service.advanceCaseStatus(followingCase.id, 'CLOSED', 'user-doc-1', 'DOCTOR')

    expect(result.status).toBe('CLOSED')
  })
})

describe('seekContact', () => {
  it('adds SEEK_CONTACT trigger to case', () => {
    const anyCase = SEED_STATE.cases[0]
    const result = service.seekContact(anyCase.patientId, anyCase.id)
    expect(result.triggers).toContain('SEEK_CONTACT')
  })
})
