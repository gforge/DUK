import { describe, expect,it } from 'vitest'

import { normalizeIsoDateTime } from '@/api/service/utils'
import { computeDueAtFromInput } from '@/components/case/triage/utils'

// utility to remove time portion for easier assertions
function stripTime(iso: string) {
  return iso.slice(0, 10)
}

describe('dueAt helper functions', () => {
  describe('computeDueAtFromInput', () => {
    it('passes through full ISO datetime unchanged', () => {
      const input = '2023-03-05T12:34:56.000Z'
      expect(computeDueAtFromInput(input)).toBe(input)
    })

    it('converts date-only ISO to datetime at midnight UTC', () => {
      const out = computeDueAtFromInput('2023-03-05')
      expect(out).not.toBeNull()
      expect(out && stripTime(out)).toBe('2023-03-05')
      expect(out && out.endsWith('Z')).toBe(true)
    })

    it('handles shorthand and localized dates', () => {
      // We only assert format, not exact value because relative outcomes vary
      expect(computeDueAtFromInput('1/1')).toMatch(/^\d{4}-01-01T00:00:00\.000Z$/)
      expect(computeDueAtFromInput('1 mars')).toMatch(/-03-01T00:00:00\.000Z$/)
      expect(computeDueAtFromInput('2w')).toMatch(/T00:00:00\.000Z$/)
    })

    it('returns null for nonsense', () => {
      expect(computeDueAtFromInput('bogus')).toBeNull()
      expect(computeDueAtFromInput('')).toBeNull()
      expect(computeDueAtFromInput(null)).toBeNull()
      expect(computeDueAtFromInput(undefined)).toBeNull()
    })
  })

  describe('normalizeIsoDateTime', () => {
    it('appends time when only date provided', () => {
      const n = normalizeIsoDateTime('2022-12-31')
      expect(n).not.toBeNull()
      expect(stripTime(n!)).toBe('2022-12-31')
    })

    it('returns null on invalid strings', () => {
      expect(normalizeIsoDateTime('not-a-date')).toBeNull()
      expect(normalizeIsoDateTime('')).toBeNull()
      expect(normalizeIsoDateTime(null)).toBeNull()
      expect(normalizeIsoDateTime(123)).toBeNull()
    })

    it('preserves full ISO strings', () => {
      const iso = '2021-01-02T03:04:05.678Z'
      expect(normalizeIsoDateTime(iso)).toBe(iso)
    })
  })
})
