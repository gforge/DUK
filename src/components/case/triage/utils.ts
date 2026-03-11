import { parseDeadlineInput } from './parseDeadlineInput'

/**
 * Convert a user-entered dueAt string into a full ISO timestamp, or null.
 *
 * The form allows a wide variety of shorthand and date-only inputs.  For the
 * stored case model we require a complete ISO datetime (the same format
 * produced by `new Date().toISOString()`).  This helper centralises the
 * conversion logic and is covered by unit tests.
 */
export function computeDueAtFromInput(input?: string | null): string | null {
  const trimmed = input?.trim()
  if (!trimmed) return null

  const parsed = parseDeadlineInput(trimmed)
  if (parsed) {
    const d = new Date(parsed)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}
