import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as forms from '@/api/service/forms'
import { getStore, initStore } from '@/api/storage'
import { LONG_WAIT_DAYS, waitedDays } from '@/components/dashboard/sortCases'

/**
 * "Väntat" counts from when the case entered the review queue (scheduledAt), not from the
 * surgery or injury. The clinic target is that everything is attended within a week, so the
 * demo must not show a queue full of month-old items.
 */
describe('seed queue waiting times', () => {
  // Deliberately just past the one-week target so the overdue styling is visible.
  const OVERDUE_EXAMPLES = new Set(['case-25', 'case-ref-3'])
  const now = new Date()

  it('every open case has waited at most ten days', () => {
    for (const c of SEED_STATE.cases.filter((c) => c.status !== 'CLOSED')) {
      expect(waitedDays(c, now), c.id).toBeLessThanOrEqual(10)
    }
  })

  it('only the designated examples exceed the one-week target', () => {
    const overdue = SEED_STATE.cases
      .filter((c) => c.status !== 'CLOSED' && waitedDays(c, now) >= LONG_WAIT_DAYS + 1)
      .map((c) => c.id)
    expect(new Set(overdue)).toEqual(OVERDUE_EXAMPLES)
  })

  it('queue entry is never before the case was created', () => {
    for (const c of SEED_STATE.cases) {
      expect(Date.parse(c.scheduledAt), c.id).toBeGreaterThanOrEqual(Date.parse(c.createdAt))
    }
  })

  it('a patient who has not opened the app cannot also be seeking contact', () => {
    for (const c of SEED_STATE.cases) {
      if (c.triggers.includes('NOT_OPENED')) {
        expect(c.triggers, c.id).not.toContain('SEEK_CONTACT')
      }
    }
  })
})

describe('queue entry on first patient signal', () => {
  beforeEach(() => {
    initStore(structuredClone(SEED_STATE))
  })

  it('a form submitted on a NEW case restarts the waiting clock', () => {
    const fresh = SEED_STATE.cases.find((c) => c.status === 'NEW')!
    const before = Date.now() - 1000
    forms.submitFormResponse(fresh.patientId, fresh.id, 'qt-numbness-infection', { PNRS_1: 3 })
    const updated = getStore().cases.find((c) => c.id === fresh.id)!
    expect(updated.status).toBe('NEEDS_REVIEW')
    expect(Date.parse(updated.scheduledAt)).toBeGreaterThanOrEqual(before)
  })

  it('a second signal on a case already waiting keeps the original queue entry', () => {
    const waiting = SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!
    forms.seekContact(waiting.patientId, waiting.id)
    const updated = getStore().cases.find((c) => c.id === waiting.id)!
    expect(updated.scheduledAt).toBe(waiting.scheduledAt)
  })
})
