/**
 * Utilities for parsing and validating Swedish personnummer (personal identity numbers).
 * Supports both ordinary personnummer and koordinationsnummer (reservnummer).
 */

export interface PnrInfo {
  isValid: boolean
  /** Day part > 60 signals a coordination number (samordningsnummer). */
  isReservnummer: boolean
  /** YYYY-MM-DD date of birth, null for reservnummer or invalid input. */
  dateOfBirth: string | null
}

/**
 * Parse a Swedish personnummer string (10- or 12-digit, with or without separator).
 */
export function parsePersonnummer(pnr: string): PnrInfo {
  const clean = pnr.replace(/[-+ ]/g, '')
  if (!/^\d{10}$|^\d{12}$/.test(clean)) {
    return { isValid: false, isReservnummer: false, dateOfBirth: null }
  }

  let year: number, month: number, day: number
  if (clean.length === 12) {
    year = parseInt(clean.slice(0, 4))
    month = parseInt(clean.slice(4, 6))
    day = parseInt(clean.slice(6, 8))
  } else {
    const yy = parseInt(clean.slice(0, 2))
    month = parseInt(clean.slice(2, 4))
    day = parseInt(clean.slice(4, 6))
    const currentYear = new Date().getFullYear()
    const century = yy + 2000 > currentYear ? 1900 : 2000
    year = century + yy
  }

  const isReservnummer = day > 60
  const actualDay = isReservnummer ? day - 60 : day

  const d = new Date(year, month - 1, actualDay)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== actualDay) {
    return { isValid: false, isReservnummer, dateOfBirth: null }
  }

  const dateOfBirth = isReservnummer
    ? null
    : `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`

  return { isValid: true, isReservnummer, dateOfBirth }
}

/**
 * Format a 12-digit personnummer to the display format `YYYYMMDD-XXXX`.
 */
export function formatPersonnummer(pnr12: string): string {
  if (pnr12.length !== 12) return pnr12
  return `${pnr12.slice(0, 2)}\u00a0${pnr12.slice(2, 8)}-${pnr12.slice(8)}`
}
