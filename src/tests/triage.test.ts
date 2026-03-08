import { beforeEach,describe, expect, it } from 'vitest'

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
        nextStep: 'PHONE_CALL',
        deadline: new Date().toISOString(),
        assignedRole: 'NURSE',
        internalNote: 'Test note',
        patientMessage: 'Test msg',
        closeImmediately: false,
      },
      'user-pal-1',
      'PAL',
    )

    expect(result.status).toBe('TRIAGED')
    expect(result.nextStep).toBe('PHONE_CALL')
    expect(result.internalNote).toBe('Test note')
    expect(result.patientMessage).toBe('Test msg')
  })

  it('sets status to CLOSED when closeImmediately is true', () => {
    const triagedCase = SEED_STATE.cases.find((c) => c.status === 'TRIAGED')
    if (!triagedCase) throw new Error('No TRIAGED case in seed data')

    const result = service.triageCase(
      triagedCase.id,
      {
        nextStep: 'NO_ACTION',
        deadline: new Date().toISOString(),
        assignedRole: 'DOCTOR',
        internalNote: '',
        patientMessage: '',
        closeImmediately: true,
      },
      'user-doc-1',
      'DOCTOR',
    )

    expect(result.status).toBe('CLOSED')
  })

  it('throws when trying to triage a NEW case directly to TRIAGED', () => {
    const newCase = SEED_STATE.cases.find((c) => c.status === 'NEW')
    if (!newCase) throw new Error('No NEW case in seed data')

    expect(() =>
      service.triageCase(
        newCase.id,
        {
          nextStep: 'PHONE_CALL',
          deadline: new Date().toISOString(),
          assignedRole: 'NURSE',
          internalNote: '',
          patientMessage: '',
          closeImmediately: false,
        },
        'user-doc-1',
        'DOCTOR',
      ),
    ).toThrow()
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

  it('throws on invalid transition', () => {
    const newCase = SEED_STATE.cases.find((c) => c.status === 'NEW')
    if (!newCase) throw new Error('No NEW case in seed data')

    expect(() => service.advanceCaseStatus(newCase.id, 'CLOSED', 'user-doc-1', 'DOCTOR')).toThrow()
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
