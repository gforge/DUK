import { beforeEach,describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

describe('modifyPatientJourney', () => {
  it('throws for unknown journey id', () => {
    expect(() =>
      service.modifyPatientJourney('nonexistent', {
        type: 'REMOVE_STEP',
        addedByUserId: 'user-pal-1',
        reason: 'test',
        stepId: 'jte-std-1',
      }),
    ).toThrow()
  })

  it('records the modification in the journey', () => {
    service.modifyPatientJourney('pj-1', {
      type: 'REMOVE_STEP',
      addedByUserId: 'user-pal-1',
      reason: 'clinical reason',
      stepId: 'jte-std-1',
    })
    const journeys = service.getPatientJourneys('p-1')
    const mod = journeys[0].modifications.find((m) => m.stepId === 'jte-std-1')
    expect(mod).toBeDefined()
    expect(mod!.reason).toBe('clinical reason')
  })

  it('SWITCH_TEMPLATE updates journeyTemplateId', () => {
    service.modifyPatientJourney('pj-1', {
      type: 'SWITCH_TEMPLATE',
      addedByUserId: 'user-pal-1',
      reason: 'complication',
      previousTemplateId: 'jt-standard',
      newTemplateId: 'jt-complex',
    })
    const journeys = service.getPatientJourneys('p-1')
    expect(journeys[0].journeyTemplateId).toBe('jt-complex')
    // old template preserved in modification record
    expect(journeys[0].modifications[0].previousTemplateId).toBe('jt-standard')
  })

  it('SWITCH_TEMPLATE with newStartDate resets the journey start date', () => {
    service.modifyPatientJourney('pj-1', {
      type: 'SWITCH_TEMPLATE',
      addedByUserId: 'user-pal-1',
      reason: 'Surgery occurred — resetting timeline',
      previousTemplateId: 'jt-standard',
      newTemplateId: 'jt-complex',
      previousStartDate: '2026-01-15',
      newStartDate: '2026-02-10',
    })
    const journeys = service.getPatientJourneys('p-1')
    expect(journeys[0].journeyTemplateId).toBe('jt-complex')
    expect(journeys[0].startDate).toBe('2026-02-10')
    const mod = journeys[0].modifications[0]
    expect(mod.previousStartDate).toBe('2026-01-15')
    expect(mod.newStartDate).toBe('2026-02-10')
  })
})

// ─── deriveJourneyTemplate ───────────────────────────────────────────────────

describe('deriveJourneyTemplate', () => {
  it('creates a child template with parentTemplateId set', () => {
    const child = service.deriveJourneyTemplate('jt-standard', 'Standard copy')
    expect(child.parentTemplateId).toBe('jt-standard')
    expect(child.name).toBe('Standard copy')
    expect(child.derivedAt).toBeDefined()
    // Should have same number of entries as parent
    const parent = service.getJourneyTemplates().find((t) => t.id === 'jt-standard')!
    expect(child.entries.length).toBe(parent.entries.length)
  })

  it('child gets new ids for entries (deep copy)', () => {
    const child = service.deriveJourneyTemplate('jt-standard', 'Test copy')
    const parent = service.getJourneyTemplates().find((t) => t.id === 'jt-standard')!
    const parentIds = parent.entries.map((e) => e.id)
    const childIds = child.entries.map((e) => e.id)
    // No id overlap
    expect(childIds.every((id) => !parentIds.includes(id))).toBe(true)
  })

  it('throws when parent does not exist', () => {
    expect(() => service.deriveJourneyTemplate('nonexistent', 'X')).toThrow()
  })
})

// ─── computeParentDiff / applyParentDiff ────────────────────────────────────

describe('computeParentDiff', () => {
  it('returns empty for template without parent', () => {
    expect(service.computeParentDiff('jt-standard')).toEqual([])
  })

  it('detects CHANGED entries after parent modification', () => {
    // jt-proximal-humerus is derived from jt-standard
    // Modify parent entry label
    const templates = service.getJourneyTemplates()
    const parent = templates.find((t) => t.id === 'jt-standard')!
    service.saveJourneyTemplate({
      ...parent,
      entries: parent.entries.map((e, i) => (i === 0 ? { ...e, label: 'Updated first step' } : e)),
    })
    const diffs = service.computeParentDiff('jt-proximal-humerus')
    const changed = diffs.filter((d) => d.type === 'CHANGED')
    expect(changed.length).toBeGreaterThanOrEqual(1)
  })
})

describe('applyParentDiff', () => {
  it('applies selected diffs and updates derivedAt', () => {
    // Modify parent
    const templates = service.getJourneyTemplates()
    const parent = templates.find((t) => t.id === 'jt-standard')!
    service.saveJourneyTemplate({
      ...parent,
      entries: parent.entries.map((e, i) => (i === 0 ? { ...e, label: 'Synced label' } : e)),
    })

    const diffs = service.computeParentDiff('jt-proximal-humerus')
    const changedIds = diffs.filter((d) => d.type === 'CHANGED').map((d) => d.entryId)
    expect(changedIds.length).toBeGreaterThanOrEqual(1)

    const before = service.getJourneyTemplates().find((t) => t.id === 'jt-proximal-humerus')!
    const updated = service.applyParentDiff('jt-proximal-humerus', changedIds)
    expect(updated.derivedAt).not.toBe(before.derivedAt)
    // After sync, diff should be empty for those entries
    const postDiffs = service.computeParentDiff('jt-proximal-humerus')
    const stillChanged = postDiffs.filter(
      (d) => d.type === 'CHANGED' && changedIds.includes(d.entryId),
    )
    expect(stillChanged.length).toBe(0)
  })
})
