import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { categoryFromDaysAgo } from '@/api/seed/seedHelpers'
import * as service from '@/api/service'
import { initStore } from '@/api/storage'

/**
 * Dashboard columns are defined by time since the triggering event
 * (fracture, surgery …): 0–2 weeks Akut, 2–8 weeks Subakut, later Kontroll.
 */
describe('dashboard category — time since triggering event', () => {
  it('categoryFromDaysAgo follows the 2-week / 8-week boundaries', () => {
    expect(categoryFromDaysAgo(0)).toBe('ACUTE')
    expect(categoryFromDaysAgo(14)).toBe('ACUTE')
    expect(categoryFromDaysAgo(15)).toBe('SUBACUTE')
    expect(categoryFromDaysAgo(56)).toBe('SUBACUTE')
    expect(categoryFromDaysAgo(57)).toBe('CONTROL')
    expect(categoryFromDaysAgo(365)).toBe('CONTROL')
  })

  it('post-event templates (injury/surgery) categorise every step by its offset', () => {
    const postEvent = SEED_STATE.journeyTemplates.filter(
      (t) => t.anchorEventType === 'INJURY' || t.anchorEventType === 'SURGERY_COMPLETED',
    )
    expect(postEvent.length).toBeGreaterThan(0)
    for (const template of postEvent) {
      for (const entry of template.entries) {
        expect(entry.dashboardCategory, `${template.id} / ${entry.label}`).toBe(
          categoryFromDaysAgo(entry.offsetDays),
        )
      }
    }
  })

  it('referral, waiting-list and monitoring templates are planned follow-up (Kontroll)', () => {
    const planned = SEED_STATE.journeyTemplates.filter(
      (t) => t.anchorEventType !== 'INJURY' && t.anchorEventType !== 'SURGERY_COMPLETED',
    )
    expect(planned.length).toBeGreaterThan(0)
    for (const template of planned) {
      for (const entry of template.entries) {
        expect(entry.dashboardCategory, `${template.id} / ${entry.label}`).toBe('CONTROL')
      }
    }
  })

  describe('getCasesForDashboard', () => {
    beforeEach(() => {
      initStore(structuredClone(SEED_STATE))
    })

    it('uses the journey of the case’s own episode when a patient has several', () => {
      // Birgit (p-23): 1-year femur control (ep-24) and a new wrist fracture (ep-25)
      const byId = new Map(service.getCasesForDashboard().map((c) => [c.id, c]))
      expect(byId.get('case-24')?.activeCategory).toBe('CONTROL')
      expect(byId.get('case-25')?.activeCategory).toBe('ACUTE')
    })

    it('includes the first day of a step window', () => {
      // Peter (p-4): surgery 25 days ago — first day of the "Vecka 4" window (28 ± 3)
      const byId = new Map(service.getCasesForDashboard().map((c) => [c.id, c]))
      expect(byId.get('case-4')?.activeCategory).toBe('SUBACUTE')
    })
  })
})
