/**
 * Simple seeded PRNG (xorshift32) — deterministic pseudo-random numbers
 * for the realistic seed without any external dependencies.
 */
export function makePrng(seed: number) {
  let s = seed >>> 0 || 1
  return {
    next(): number {
      s ^= s << 13
      s ^= s >> 17
      s ^= s << 5
      s = s >>> 0
      return s / 0xffffffff
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1))
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)]
    },
    bool(prob = 0.5): boolean {
      return this.next() < prob
    },
  }
}
