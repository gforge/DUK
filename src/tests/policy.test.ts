import { describe, it, expect } from 'vitest'
import { evaluateExpression, validateExpression } from '../api/policyParser'

describe('validateExpression', () => {
  it('accepts valid simple comparison', () => {
    expect(validateExpression('PNRS_1 >= 7')).toBeNull()
  })

  it('accepts dot-notation identifiers', () => {
    expect(validateExpression('OSS.total < 22')).toBeNull()
  })

  it('accepts compound expressions', () => {
    expect(validateExpression('PNRS_1 >= 7 && OSS.total < 22')).toBeNull()
  })

  it('accepts OR expressions', () => {
    expect(validateExpression('EQ5D.index <= 0.5 || EQ_VAS < 30')).toBeNull()
  })

  it('accepts parenthesised arithmetic', () => {
    expect(validateExpression('(OSS.total + PNRS_1) > 25')).toBeNull()
  })

  it('rejects empty expression', () => {
    expect(validateExpression('')).not.toBeNull()
  })

  it('rejects expression with unmatched parens', () => {
    expect(validateExpression('(PNRS_1 >= 7')).not.toBeNull()
  })

  it('rejects expression with invalid operator', () => {
    expect(validateExpression('PNRS_1 =! 7')).not.toBeNull()
  })
})

describe('evaluateExpression', () => {
  const scope = {
    PNRS_1: 8,
    PNRS_2: 3,
    'OSS.total': 18,
    'EQ5D.index': 0.42,
    EQ_VAS: 25,
  }

  it('evaluates true comparison', () => {
    const result = evaluateExpression('PNRS_1 >= 7', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('evaluates false comparison', () => {
    const result = evaluateExpression('PNRS_2 >= 7', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(false)
  })

  it('evaluates AND correctly', () => {
    const result = evaluateExpression('PNRS_1 >= 7 && OSS.total < 22', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('evaluates OR correctly', () => {
    // PNRS_2 >= 7 is false, EQ5D.index <= 0.5 is true → true
    const result = evaluateExpression('PNRS_2 >= 7 || EQ5D.index <= 0.5', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('evaluates arithmetic', () => {
    // OSS.total + PNRS_1 = 26 > 25 → true
    const result = evaluateExpression('(OSS.total + PNRS_1) > 25', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('evaluates dot-notation scope', () => {
    const result = evaluateExpression('EQ5D.index < 0.5', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('does not throw for unknown variable', () => {
    expect(() => evaluateExpression('UNKNOWN_VAR > 5', scope)).not.toThrow()
  })

  it('evaluates equality', () => {
    const result = evaluateExpression('PNRS_1 == 8', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(true)
  })

  it('evaluates inequality', () => {
    const result = evaluateExpression('PNRS_1 != 8', scope)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe(false)
  })

  it('returns error for malformed expression', () => {
    const result = evaluateExpression('PNRS_1 >=', scope)
    expect(result.ok).toBe(false)
  })
})
