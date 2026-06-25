import { Parser } from './parser'
import { tokenise } from './tokens'

export interface ParseError {
  ok: false
  error: string
}
export interface ParseOk {
  ok: true
  result: number | boolean
  resolvedVars: Record<string, number>
}
export type ParseResult = ParseOk | ParseError

/** Evaluate a policy expression against a flat numeric scope. Never throws. */
export function evaluateExpression(expression: string, scope: Record<string, number>): ParseResult {
  try {
    const tokens = tokenise(expression)
    const parser = new Parser(tokens, scope)
    const result = parser.parseExpr()
    return { ok: true, result, resolvedVars: parser.resolvedVars }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/**
 * Validate that an expression parses without errors.
 * Returns null if valid, or an error message string.
 */
export function validateExpression(expression: string): string | null {
  try {
    const tokens = tokenise(expression)
    const fakeScope: Record<string, number> = new Proxy({} as Record<string, number>, {
      get: () => 0,
      has: () => true,
    })
    const parser = new Parser(tokens, fakeScope)
    parser.parseExpr()
    return null
  } catch (err) {
    return String(err)
  }
}
