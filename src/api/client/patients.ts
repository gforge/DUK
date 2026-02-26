import * as service from '../service'
import type { Patient } from '../schemas'
import { withDelay } from './delay'
import { formatPersonnummer } from '../utils/personnummer'

export const getPatients = (): Promise<Patient[]> => withDelay(() => service.getPatients())

export const getPatient = (id: string): Promise<Patient | undefined> =>
  withDelay(() => service.getPatient(id))

export const createPatient = (
  data: Pick<Patient, 'displayName' | 'personalNumber' | 'dateOfBirth'>,
): Promise<Patient> => withDelay(() => service.createPatient(data))

export const patientOpenedApp = (patientId: string): Promise<Patient> =>
  withDelay(() => service.patientOpenedApp(patientId))

// ─── Fake "befolkningsregistret" lookup ───────────────────────────────────────
// In a real system this would call an external API. Here we simulate it with a
// static table that covers the seeded demo patients plus a few extra entries.

const FAKE_REGISTER: Record<string, { displayName: string }> = {
  // Seeded demo patients (12-digit personnummer without separator)
  '194501010001': { displayName: 'Anders Andersson' },
  '196503152222': { displayName: 'Elin Elinsson' },
  '197807204444': { displayName: 'Karl Karlsson' },
  '195512125555': { displayName: 'Peter Petersson' },
  '198804086666': { displayName: 'Torkel Torkelson' },
  '197202177777': { displayName: 'Maria Magnusson' },
  '196609099999': { displayName: 'Sven Svensson' },
  '195003038888': { displayName: 'Britta Bryngelsson' },
  '197511151111': { displayName: 'Gunnar Gustafsson' },
  '198001013333': { displayName: 'Lena Lindberg' },
  // Extra entries findable in the demo but not yet registered as patients
  '197303031234': { displayName: 'Anna Johansson' },
  '196811112222': { displayName: 'Lars-Erik Nilsson' },
  '200205152525': { displayName: 'Emma Söderström' },
  '198907074321': { displayName: 'Jonas Bergman' },
  '197612126789': { displayName: 'Karin Holm' },
}

/**
 * Simulated lookup in the Swedish population register (befolkningsregistret).
 * Normalises the personnummer to 12 digits (no separator) before looking it up.
 * Returns the registered name, or null when the number is not found.
 */
export const lookupPersonnummer = (
  personalNumber: string,
): Promise<{ displayName: string } | null> => {
  const normalized = personalNumber.replace(/[-+ ]/g, '')
  let result: { displayName: string } | null = null
  if (normalized.length === 12) {
    result = FAKE_REGISTER[normalized] ?? null
  } else if (normalized.length === 10) {
    // Try matching by the last 10 digits of the 12-digit keys
    const entry = Object.entries(FAKE_REGISTER).find(([k]) => k.slice(2) === normalized)
    result = entry ? entry[1] : null
  }
  return withDelay(() => result)
}

export interface DemoRegisterHint {
  pnr: string // formatted YYYYMMDD-XXXX
  pnr12: string // raw 12-digit (for lookup)
  displayName: string
}

/**
 * Returns all entries from the simulated population register, formatted for
 * display in the registration help box. This exists purely for the demo UI.
 */
export const getDemoRegisterHints = (): Promise<DemoRegisterHint[]> =>
  withDelay(() =>
    Object.entries(FAKE_REGISTER).map(([pnr12, { displayName }]) => ({
      pnr12,
      pnr: formatPersonnummer(pnr12),
      displayName,
    })),
  )
