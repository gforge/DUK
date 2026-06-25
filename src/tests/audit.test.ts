import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service/audit'
import { getStore, initStore } from '@/api/storage'

// initial store before each test
beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('audit service', () => {
  it('logContactEvent appends an audit event for each action with a timestamp', () => {
    const caseId = SEED_STATE.cases[0].id
    const userId = SEED_STATE.users[0].id
    const userRole = SEED_STATE.users[0].role

    const actions: service.ContactAction[] = ['CONTACTED', 'REMINDER_SENT', 'CALL_ATTEMPT']

    const beforeCount = getStore().auditEvents.filter((e) => e.caseId === caseId).length

    actions.forEach((action) => {
      service.logContactEvent(caseId, userId, userRole, action)
    })

    const events = getStore().auditEvents.filter((e) => e.caseId === caseId)
    expect(events.length).toBeGreaterThanOrEqual(beforeCount + actions.length)

    actions.forEach((action) => {
      const ev = events.find((e) => e.action === action)
      expect(ev).toBeDefined()
      expect(ev?.timestamp).toBeDefined()
      // timestamp should be parseable ISO
      expect(() => new Date(ev!.timestamp).toISOString()).not.toThrow()
    })
  })
})
