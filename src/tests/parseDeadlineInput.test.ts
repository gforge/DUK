import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isDeadlineShorthand,
  parseDeadlineInput,
} from '@/components/case/triage/parseDeadlineInput'

// Fix "today" to 2026-02-25 (Wednesday) for deterministic output
const FIXED_NOW = new Date('2026-02-25T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('parseDeadlineInput', () => {
  it('returns null for empty string', () => {
    expect(parseDeadlineInput('')).toBeNull()
    expect(parseDeadlineInput('   ')).toBeNull()
  })

  it('returns null for unrecognised input', () => {
    expect(parseDeadlineInput('abc')).toBeNull()
    expect(parseDeadlineInput('1x')).toBeNull()
    expect(parseDeadlineInput('two days')).toBeNull()
  })

  it('parses days (d)', () => {
    expect(parseDeadlineInput('1d')).toBe('2026-02-26')
    expect(parseDeadlineInput('4d')).toBe('2026-03-01')
    expect(parseDeadlineInput('7d')).toBe('2026-03-04')
    expect(parseDeadlineInput('14d')).toBe('2026-03-11')
  })

  it('parses weeks — Swedish suffix (v)', () => {
    expect(parseDeadlineInput('1v')).toBe('2026-03-04')
    expect(parseDeadlineInput('2v')).toBe('2026-03-11')
    expect(parseDeadlineInput('4v')).toBe('2026-03-25')
  })

  it('parses weeks — English suffix (w)', () => {
    expect(parseDeadlineInput('1w')).toBe('2026-03-04')
    expect(parseDeadlineInput('2w')).toBe('2026-03-11')
  })

  it('is case-insensitive', () => {
    expect(parseDeadlineInput('2D')).toBe('2026-02-27')
    expect(parseDeadlineInput('2V')).toBe('2026-03-11')
    expect(parseDeadlineInput('2W')).toBe('2026-03-11')
  })

  it('passes through a valid ISO date unchanged', () => {
    expect(parseDeadlineInput('2026-04-01')).toBe('2026-04-01')
    expect(parseDeadlineInput('2027-12-31')).toBe('2027-12-31')
  })

  it('returns null for an invalid ISO-like string', () => {
    expect(parseDeadlineInput('2026-13-01')).toBeNull()
    expect(parseDeadlineInput('not-a-date')).toBeNull()
  })

  it('parses day/month with slash separator', () => {
    expect(parseDeadlineInput('1/3')).toBe('2026-03-01') // future — this year
    expect(parseDeadlineInput('15/6')).toBe('2026-06-15')
  })

  it('parses day/month with dot separator', () => {
    expect(parseDeadlineInput('1.3')).toBe('2026-03-01')
    expect(parseDeadlineInput('25.2')).toBe('2026-02-25') // today is not past
  })

  it('rolls day/month to next year when the date has passed', () => {
    // 2026-02-25 is today; 1 Feb has already passed
    expect(parseDeadlineInput('1/2')).toBe('2027-02-01')
    expect(parseDeadlineInput('1.1')).toBe('2027-01-01')
  })

  it('returns null for an impossible day/month combination', () => {
    expect(parseDeadlineInput('31/2')).toBeNull() // 31 Feb never exists
    expect(parseDeadlineInput('32/1')).toBeNull() // day 32 is invalid
  })

  it('parses named Swedish months', () => {
    expect(parseDeadlineInput('1 mars')).toBe('2026-03-01')
    expect(parseDeadlineInput('15 augusti')).toBe('2026-08-15')
    expect(parseDeadlineInput('1 januari')).toBe('2027-01-01') // past → next year
    expect(parseDeadlineInput('1 feb')).toBe('2027-02-01') // past → next year
  })

  it('parses named English months', () => {
    expect(parseDeadlineInput('1 march')).toBe('2026-03-01')
    expect(parseDeadlineInput('15 aug')).toBe('2026-08-15')
    expect(parseDeadlineInput('1 january')).toBe('2027-01-01')
  })

  it('named month parsing is case-insensitive', () => {
    expect(parseDeadlineInput('1 Mars')).toBe('2026-03-01')
    expect(parseDeadlineInput('1 MARCH')).toBe('2026-03-01')
  })
})

describe('isDeadlineShorthand', () => {
  it('returns true for relative shorthands', () => {
    expect(isDeadlineShorthand('1d')).toBe(true)
    expect(isDeadlineShorthand('2v')).toBe(true)
    expect(isDeadlineShorthand('3w')).toBe(true)
  })

  it('returns true for day/month formats', () => {
    expect(isDeadlineShorthand('1/3')).toBe(true)
    expect(isDeadlineShorthand('1.3')).toBe(true)
    expect(isDeadlineShorthand('1 mars')).toBe(true)
    expect(isDeadlineShorthand('1 march')).toBe(true)
  })

  it('returns false for ISO dates and invalid strings', () => {
    expect(isDeadlineShorthand('2026-03-01')).toBe(false)
    expect(isDeadlineShorthand('')).toBe(false)
    expect(isDeadlineShorthand('abc')).toBe(false)
  })
})
