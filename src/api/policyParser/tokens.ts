/**
 * Tokeniser for the safe policy expression parser.
 *
 * Grammar (subset):
 *   expr       ::= comparison ( ( '&&' | '||' ) comparison )*
 *   comparison ::= term ( ( '<=' | '<' | '>=' | '>' | '==' | '!=' ) term )*
 *   term       ::= factor ( ( '+' | '-' ) factor )*
 *   factor     ::= unary ( ( '*' | '/' ) unary )*
 *   unary      ::= '-' unary | primary
 *   primary    ::= NUMBER | IDENTIFIER | '(' expr ')'
 */

export type TokenType =
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

export interface Token {
  type: TokenType
  value: string
}

export function tokenise(src: string): Token[] {
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

    const two = src.slice(i, i + 2)
    if (two === '<=') {
      tokens.push({ type: 'LE', value: '<=' })
      i += 2
      continue
    }
    if (two === '>=') {
      tokens.push({ type: 'GE', value: '>=' })
      i += 2
      continue
    }
    if (two === '==') {
      tokens.push({ type: 'EQ', value: '==' })
      i += 2
      continue
    }
    if (two === '!=') {
      tokens.push({ type: 'NEQ', value: '!=' })
      i += 2
      continue
    }
    if (two === '&&') {
      tokens.push({ type: 'AND', value: '&&' })
      i += 2
      continue
    }
    if (two === '||') {
      tokens.push({ type: 'OR', value: '||' })
      i += 2
      continue
    }

    const SINGLE: Record<string, TokenType> = {
      '(': 'LPAREN',
      ')': 'RPAREN',
      '+': 'PLUS',
      '-': 'MINUS',
      '*': 'STAR',
      '/': 'SLASH',
      '<': 'LT',
      '>': 'GT',
    }
    if (ch in SINGLE) {
      tokens.push({ type: SINGLE[ch], value: ch })
      i++
      continue
    }

    throw new Error(`Unknown character: ${ch}`)
  }
  tokens.push({ type: 'EOF', value: '' })
  return tokens
}
