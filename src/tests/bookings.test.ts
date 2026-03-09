import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service/cases'
import { getStore, initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('bookings service', () => {
  it('createBooking appends booking to case and records audit', () => {
    const caseId = SEED_STATE.cases[0].id
    const booking = {
      id: 'b-1',
      type: 'DOCTOR_VISIT',
      role: 'DOCTOR' as any,
      scheduledAt: new Date().toISOString(),
      note: 'Urgent follow-up',
      createdByUserId: SEED_STATE.users[0].id,
      createdAt: new Date().toISOString(),
    }

    service.createBooking(caseId, booking, SEED_STATE.users[0].id, 'PAL')
    const s = getStore()
    const c = s.cases.find((c) => c.id === caseId)!
    expect(c.bookings).toBeDefined()
    expect(c.bookings!.length).toBeGreaterThan(0)
    expect(c.bookings!.some((b) => b.id === 'b-1')).toBeTruthy()

    // audit event appended
    const ev = s.auditEvents.find((e) => e.action === 'BOOKING_CREATED' && e.caseId === caseId)
    expect(ev).toBeDefined()
  })

  it('updateBooking updates booking fields and records audit', () => {
    const caseId = SEED_STATE.cases[0].id
    const booking = {
      id: 'b-2',
      type: 'NURSE_VISIT',
      role: 'NURSE' as any,
      scheduledAt: new Date().toISOString(),
      note: 'Initial',
      createdByUserId: SEED_STATE.users[0].id,
      createdAt: new Date().toISOString(),
    }
    service.createBooking(caseId, booking, SEED_STATE.users[0].id, 'PAL')

    const newTime = new Date(Date.now() + 3600_000).toISOString()
    service.updateBooking(
      caseId,
      'b-2',
      { scheduledAt: newTime, note: 'Rescheduled' },
      SEED_STATE.users[0].id,
      'PAL',
    )

    const s = getStore()
    const c = s.cases.find((c) => c.id === caseId)!
    const b = c.bookings!.find((x) => x.id === 'b-2')!
    expect(b.scheduledAt).toEqual(newTime)
    expect(b.note).toEqual('Rescheduled')

    const ev = s.auditEvents.find((e) => e.action === 'BOOKING_UPDATED' && e.caseId === caseId)
    expect(ev).toBeDefined()
  })

  it('cancelBooking sets status to CANCELLED', () => {
    const caseId = SEED_STATE.cases[0].id
    const booking = {
      id: 'b-3',
      type: 'PHONE_CALL',
      role: 'NURSE' as any,
      scheduledAt: new Date().toISOString(),
      note: '',
      createdByUserId: SEED_STATE.users[0].id,
      createdAt: new Date().toISOString(),
    }
    service.createBooking(caseId, booking, SEED_STATE.users[0].id, 'PAL')
    service.cancelBooking(caseId, 'b-3', SEED_STATE.users[0].id, 'PAL')

    const s = getStore()
    const c = s.cases.find((c) => c.id === caseId)!
    const b = c.bookings!.find((x) => x.id === 'b-3')!
    expect(b.status).toEqual('CANCELLED')
  })

  it('completeWorklistCase closes case and records booking completion metadata', () => {
    const followingCase = SEED_STATE.cases.find((c) => c.status === 'FOLLOWING_UP')
    if (!followingCase) throw new Error('No FOLLOWING_UP case found in seed data')

    const newBooking = {
      id: 'b-4',
      type: 'PHONE_CALL',
      role: 'NURSE' as any,
      scheduledAt: new Date().toISOString(),
      note: 'Follow-up call',
      createdByUserId: SEED_STATE.users[0].id,
      createdAt: new Date().toISOString(),
    }

    service.createBooking(followingCase.id, newBooking, SEED_STATE.users[0].id, 'PAL')

    const followUpDate = new Date(Date.now() + 86_400_000).toISOString()
    const completedAt = new Date().toISOString()
    const completionComment = 'Patient informed about closure plan.'
    const result = service.completeWorklistCase(followingCase.id, SEED_STATE.users[0].id, 'PAL', {
      bookingId: 'b-4',
      followUpDate,
      completedAt,
      completionComment,
    })

    expect(result.status).toBe('CLOSED')
    expect(result.closedAt).toBeTruthy()
    const completedBooking = result.bookings?.find((b) => b.id === 'b-4')
    expect(completedBooking?.status).toBe('COMPLETED')
    expect(completedBooking?.completedAt).toBeTruthy()
    expect(completedBooking?.completedByUserId).toBe(SEED_STATE.users[0].id)
    expect(completedBooking?.followUpDate).toBe(followUpDate)
    expect(completedBooking?.completionComment).toBe(completionComment)

    const s = getStore()
    const ev = [...s.auditEvents]
      .reverse()
      .find((e) => e.action === 'STATUS_CHANGED' && e.caseId === followingCase.id)
    expect(ev).toBeDefined()
    expect(ev?.details?.closedAt).toBeTruthy()
  })
})
