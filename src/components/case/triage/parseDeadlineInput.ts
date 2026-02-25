/**
 * Parses a deadline shorthand string into an ISO date (YYYY-MM-DD).
 *
 * Accepted shorthands:
 *   <n>d            — n days from today      (e.g. "3d")
 *   <n>v            — n weeks from today     (Swedish: vecka, e.g. "2v")
 *   <n>w            — n weeks from today     (English: week, e.g. "2w")
 *   <day>/<month>   — day/month, e.g. "1/3"  → 1 March
 *   <day>.<month>   — day.month, e.g. "1.3"  → 1 March
 *   <day> <month>   — named month, e.g. "1 mars" / "1 march"
 *
 * Day/month formats use the current year; if the resulting date has
 * already passed, next year is used automatically.
 * Also passes through existing YYYY-MM-DD strings unchanged.
 * Returns null for empty or unrecognised input.
 */

const SHORTHAND_RE = /^(\d+)\s*(d|v|w)$/i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// day/month with / or . separator, e.g. "1/3" or "1.3"
const SLASH_DOT_RE = /^(\d{1,2})[/.](\d{1,2})$/
// day + named month, e.g. "1 mars" or "1 march"
const NAMED_MONTH_RE = /^(\d{1,2})\s+([a-zåä]+)$/i

const MONTH_NAMES: Record<string, number> = {
  // Swedish
  januari: 1,
  februari: 2,
  mars: 3,
  april: 4,
  maj: 5,
  juni: 6,
  juli: 7,
  augusti: 8,
  september: 9,
  oktober: 10,
  november: 11,
  december: 12,
  // English
  january: 1,
  february: 2,
  march: 3,
  /* april, june, september, november shared */ may: 5,
  june: 6,
  july: 7,
  august: 8,
  october: 10,
  // Short forms
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  okt: 10,
  oct: 10,
  nov: 11,
  dec: 12,
}

/**
 * Given day (1-based) and month (1-based), returns YYYY-MM-DD for the
 * nearest upcoming occurrence (this year, or next year if already past).
 */
function resolveYearForDayMonth(day: number, month: number): string | null {
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  const todayStr = new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')

  function tryYear(y: number): string | null {
    const d = new Date(y, month - 1, day)
    // Reject overflow (e.g. Feb 31 rolls into March)
    if (d.getMonth() !== month - 1) return null
    return `${y}-${pad(month)}-${pad(day)}`
  }

  const thisYear = tryYear(year)
  if (thisYear && thisYear >= todayStr) return thisYear
  return tryYear(year + 1)
}

export function parseDeadlineInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Relative offset: 3d, 2v, 1w
  const shorthandMatch = trimmed.match(SHORTHAND_RE)
  if (shorthandMatch) {
    const n = parseInt(shorthandMatch[1], 10)
    const unit = shorthandMatch[2].toLowerCase()
    const days = unit === 'd' ? n : n * 7
    // Use noon to avoid DST-induced off-by-one on date boundaries
    const date = new Date(Date.now() + days * 86_400_000)
    return date.toISOString().slice(0, 10)
  }

  // Numeric day/month: 1/3 or 1.3
  const slashDotMatch = trimmed.match(SLASH_DOT_RE)
  if (slashDotMatch) {
    return resolveYearForDayMonth(parseInt(slashDotMatch[1], 10), parseInt(slashDotMatch[2], 10))
  }

  // Named month: "1 mars", "1 march", "15 aug"
  const namedMatch = trimmed.match(NAMED_MONTH_RE)
  if (namedMatch) {
    const month = MONTH_NAMES[namedMatch[2].toLowerCase()]
    if (month) return resolveYearForDayMonth(parseInt(namedMatch[1], 10), month)
  }

  // ISO passthrough
  if (ISO_DATE_RE.test(trimmed) && !isNaN(Date.parse(trimmed))) {
    return trimmed
  }

  return null
}

/** Returns true when the input looks like any recognised shorthand (not a full ISO date). */
export function isDeadlineShorthand(input: string): boolean {
  const t = input.trim()
  return SHORTHAND_RE.test(t) || SLASH_DOT_RE.test(t) || NAMED_MONTH_RE.test(t)
}
