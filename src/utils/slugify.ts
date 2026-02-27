/**
 * Converts a human-readable label into a valid identifier suitable for use
 * as a step key in policy expressions.
 *
 * Examples:
 *   "Week 4"        → "week_4"
 *   "6-month check" → "6_month_check"
 *   "Dag 14 (OSS)"  → "dag_14_oss"
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s\-–—]+/g, '_') // spaces and hyphens → underscore
    .replace(/[^a-z0-9_]/g, '') // strip anything else
    .replace(/_{2,}/g, '_') // collapse repeated underscores
    .replace(/^_|_$/g, '') // trim leading/trailing underscores
}
