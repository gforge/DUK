/**
 * Safe policy expression parser – no eval, no Function constructor.
 *
 * Grammar (subset):
 *   expr     ::= comparison ( ( '&&' | '||' ) comparison )*
 *   comparison ::= term ( ( '<=' | '<' | '>=' | '>' | '==' | '!=' ) term )*
 *   term     ::= factor ( ( '+' | '-' ) factor )*
 *   factor   ::= unary ( ( '*' | '/' ) unary )*
 *   unary    ::= '-' unary | primary
 *   primary  ::= NUMBER | IDENTIFIER | '(' expr ')'
 *   IDENTIFIER ::= [a-zA-Z_][a-zA-Z0-9_]* ( '.' [a-zA-Z_][a-zA-Z0-9_]* )*
 */

// ─── Tokeniser ────────────────────────────────────────────────────────────────

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'LPAREN'
  | 'RPAREN'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'LE'
  | 'LT'
  | 'GE'
  | 'GT'
  | 'EQ'
  | 'NEQ'
  | 'AND'
  | 'OR'
  | 'EOF'

interface Token {
  type: TokenType
  value: string
}

function tokenise(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let num = ''
      while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++]
      tokens.push({ type: 'NUMBER', value: num })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let id = ''
      while (i < src.length && /[a-zA-Z0-9_.]/.test(src[i])) id += src[i++]
      tokens.push({ type: 'IDENT', value: id })
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' })
      i++
      continue
    }
    if (ch === '+') {
      tokens.push({ type: 'PLUS', value: '+' })
      i++
      continue
    }
    if (ch === '-') {
      tokens.push({ type: 'MINUS', value: '-' })
      i++
      continue
    }
    if (ch === '*') {
      tokens.push({ type: 'STAR', value: '*' })
      i++
      continue
    }
    if (ch === '/') {
      tokens.push({ type: 'SLASH', value: '/' })
      i++
      continue
    }
    if (src.slice(i, i + 2) === '<=') {
      tokens.push({ type: 'LE', value: '<=' })
      i += 2
      continue
    }
    if (src.slice(i, i + 2) === '>=') {
      tokens.push({ type: 'GE', value: '>=' })
      i += 2
      continue
    }
    if (src.slice(i, i + 2) === '==') {
      tokens.push({ type: 'EQ', value: '==' })
      i += 2
      continue
    }
    if (src.slice(i, i + 2) === '!=') {
      tokens.push({ type: 'NEQ', value: '!=' })
      i += 2
      continue
    }
    if (src.slice(i, i + 2) === '&&') {
      tokens.push({ type: 'AND', value: '&&' })
      i += 2
      continue
    }
    if (src.slice(i, i + 2) === '||') {
      tokens.push({ type: 'OR', value: '||' })
      i += 2
      continue
    }
    if (ch === '<') {
      tokens.push({ type: 'LT', value: '<' })
      i++
      continue
    }
    if (ch === '>') {
      tokens.push({ type: 'GT', value: '>' })
      i++
      continue
    }
    throw new Error(`Unknown character: ${ch}`)
  }
  tokens.push({ type: 'EOF', value: '' })
  return tokens
}

// ─── Parser ───────────────────────────────────────────────────────────────────

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

class Parser {
  private pos = 0
  public resolvedVars: Record<string, number> = {}

  constructor(
    private tokens: Token[],
    private scope: Record<string, number>,
  ) {}

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  private match(...types: TokenType[]): boolean {
    if (types.includes(this.peek().type)) {
      this.consume()
      return true
    }
    return false
  }

  /** Top-level: logical OR */
  parseExpr(): number | boolean {
    let left: number | boolean = this.parseAnd()
    while (this.peek().type === 'OR') {
      this.consume()
      const right = this.parseAnd()
      left = Boolean(left) || Boolean(right)
    }
    return left
  }

  private parseAnd(): number | boolean {
    let left: number | boolean = this.parseComparison()
    while (this.peek().type === 'AND') {
      this.consume()
      const right = this.parseComparison()
      left = Boolean(left) && Boolean(right)
    }
    return left
  }

  private parseComparison(): number | boolean {
    const left = this.parseTerm()
    const op = this.peek().type
    if (['LE', 'LT', 'GE', 'GT', 'EQ', 'NEQ'].includes(op)) {
      this.consume()
      const right = this.parseTerm()
      if (typeof left !== 'number' || typeof right !== 'number')
        throw new Error('Comparison operands must be numbers')
      if (op === 'LE') return left <= right
      if (op === 'LT') return left < right
      if (op === 'GE') return left >= right
      if (op === 'GT') return left > right
      if (op === 'EQ') return left === right
      if (op === 'NEQ') return left !== right
    }
    return left
  }

  private parseTerm(): number {
    let left = this.parseFactor()
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.consume().type
      const right = this.parseFactor()
      left = op === 'PLUS' ? left + right : left - right
    }
    return left
  }

  private parseFactor(): number {
    let left = this.parseUnary()
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const op = this.consume().type
      const right = this.parseUnary()
      if (op === 'SLASH' && right === 0) throw new Error('Division by zero')
      left = op === 'STAR' ? left * right : left / right
    }
    return left
  }

  private parseUnary(): number {
    if (this.peek().type === 'MINUS') {
      this.consume()
      return -this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): number {
    const tok = this.peek()
    if (tok.type === 'NUMBER') {
      this.consume()
      return parseFloat(tok.value)
    }
    if (tok.type === 'IDENT') {
      this.consume()
      const key = tok.value
      if (!(key in this.scope)) {
        throw new Error(`Unknown variable: ${key}`)
      }
      const val = this.scope[key]
      this.resolvedVars[key] = val
      return val
    }
    if (tok.type === 'LPAREN') {
      this.consume()
      const val = this.parseTerm()
      if (this.peek().type !== 'RPAREN') throw new Error('Expected closing )')
      this.consume()
      return val
    }
    throw new Error(`Unexpected token: ${tok.value} (${tok.type})`)
  }
}

/**
 * Evaluate a policy expression against a flat numeric scope.
 * Returns a ParseResult — never throws.
 */
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

/** Validate that an expression parses without errors against an empty scope.
 *  Used in the policy editor to show syntax errors early.
 */
export function validateExpression(expression: string): string | null {
  try {
    const tokens = tokenise(expression)
    // parse with all-zero scope to check syntax
    const fakeScope: Record<string, number> = new Proxy({} as Record<string, number>, {
      get: () => 0,
      has: () => true,
    })
    const parser = new Parser(tokens, fakeScope)
    parser.parseExpr()
    return null // no error
  } catch (err) {
    return String(err)
  }
}
