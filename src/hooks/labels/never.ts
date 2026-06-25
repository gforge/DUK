export function assertNever(x: never): never {
  throw new Error(`Unhandled enum value: ${String(x)}`)
}
