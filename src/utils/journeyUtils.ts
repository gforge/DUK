/**
 * Derives a proportional tolerance window from a step's scheduled offset.
 * Larger offsets warrant a wider window so minor scheduling drift between
 * two parallel journeys does not result in the patient filling identical
 * forms twice.
 *
 * Formula: round(offsetDays / 5), clamped to [2, 30].
 * Examples:
 *   offsetDays=0  → 2   (min)
 *   offsetDays=14 → 3
 *   offsetDays=28 → 6
 *   offsetDays=58 → 12
 *   offsetDays=90 → 18
 *   offsetDays=180 → 30  (max)
 */
export function suggestWindowDays(offsetDays: number): number {
  return Math.max(2, Math.min(30, Math.round(offsetDays / 5)))
}
