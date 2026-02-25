const MIN_DELAY = 100
const MAX_DELAY = 400

export function delay(ms?: number): Promise<void> {
  const d = ms ?? MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY))
  return new Promise((resolve) => setTimeout(resolve, d))
}

export async function withDelay<T>(fn: () => T): Promise<T> {
  await delay()
  return fn()
}
