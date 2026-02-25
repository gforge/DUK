import type { Token, TokenType } from './tokens'

/** Parser for the policy expression grammar. Mutates resolvedVars as a side-effect. */
export class Parser {
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
    const CMP: TokenType[] = ['LE', 'LT', 'GE', 'GT', 'EQ', 'NEQ']
    if (CMP.includes(op)) {
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
      left = op === 'PLUS' ? left + this.parseFactor() : left - this.parseFactor()
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
      if (!(tok.value in this.scope)) throw new Error(`Unknown variable: ${tok.value}`)
      const val = this.scope[tok.value]
      this.resolvedVars[tok.value] = val
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
