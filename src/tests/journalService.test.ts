import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service/journal'
import { getStore, initStore } from '@/api/storage'

beforeEach(() => {
  // start fresh for each test
  initStore(structuredClone(SEED_STATE))
})

describe('journal service', () => {
  it('can generate and delete a draft', () => {
    const caseId = SEED_STATE.cases[0].id
    const templateId = SEED_STATE.journalTemplates[0].id
    const userId = 'u1'
    const userRole = 'DOCTOR'

    const draft = service.generateJournalDraft(caseId, templateId, userId, userRole)
    expect(draft).toMatchObject({ caseId, templateId, status: 'DRAFT' })

    // store should now have one more draft than before
    let store = getStore()
    const beforeCount = SEED_STATE.journalDrafts.length
    expect(store.journalDrafts.length).toBe(beforeCount + 1)

    // delete it
    const removed = service.deleteJournalDraft(draft.id, userId, userRole)
    expect(removed.id).toBe(draft.id)

    store = getStore()
    expect(store.journalDrafts.find((d) => d.id === draft.id)).toBeUndefined()

    // audit event should have been recorded
    const events = store.auditEvents.filter((e) => e.action === 'JOURNAL_DRAFT_DELETED')
    expect(events.length).toBeGreaterThanOrEqual(1)
    // make sure one of them corresponds to our removal
    expect(events.some((e) => e.details?.draftId === draft.id)).toBe(true)
  })
})
