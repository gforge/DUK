import { CURRENT_SCHEMA_VERSION } from './schemaVersion'
import { AppStateSchema } from './schemas'
import type { AppState } from './schemas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in the migration chain. */
interface Migration {
  from: number
  to: number
  /** Transform raw (un-validated) state from `from` to `to`. */
  up: (state: Record<string, unknown>) => Record<string, unknown>
}

export type MigrationResultOk = { ok: true; state: AppState }
export type MigrationResultErr = {
  ok: false
  /** 'downgrade'  – stored version is newer than the app
   *  'no-path'    – no migration chain exists between stored and current version
   *  'parse-error'– migration ran but the result failed Zod validation */
  reason: 'downgrade' | 'no-path' | 'parse-error'
  storedVersion: number
  rawState: unknown
  parseError?: unknown
}
export type MigrationResult = MigrationResultOk | MigrationResultErr

// ---------------------------------------------------------------------------
// Migration registry
// ---------------------------------------------------------------------------
// Add a new entry here whenever CURRENT_SCHEMA_VERSION is bumped.
// Each entry must form a contiguous chain from 0 → CURRENT_SCHEMA_VERSION.
//
// Example for a future v2:
//   { from: 1, to: 2, up: (s) => ({ ...s, newField: defaultValue }) }
// ---------------------------------------------------------------------------

const MIGRATIONS: Migration[] = [
  {
    from: 0,
    to: 1,
    up: (s) => ({
      ...s,
      schemaVersion: 1,
      // Backfill field added in v1 (absorbs the old migrateState() in main.tsx)
      instructionTemplates: s['instructionTemplates'] ?? [],
    }),
  },
  {
    from: 1,
    to: 2,
    up: (s) => ({
      ...s,
      schemaVersion: 2,
      // Backfill recurringCompletions on all existing patientJourneys.
      // referenceDateLabel on journeyTemplates and recurrenceIntervalDays on entries
      // have Zod defaults so they are populated automatically by AppStateSchema.safeParse.
      patientJourneys: Array.isArray(s['patientJourneys'])
        ? (s['patientJourneys'] as Record<string, unknown>[]).map((j) => ({
            ...j,
            recurringCompletions: j['recurringCompletions'] ?? [],
          }))
        : [],
    }),
  },
  {
    from: 2,
    to: 3,
    up: (s) => ({
      ...s,
      schemaVersion: 3,
      // Backfill journeyTemplateId on all existing policyRules.
      // We assign them to the standard fracture template as a safe default.
      policyRules: Array.isArray(s['policyRules'])
        ? (s['policyRules'] as Record<string, unknown>[]).map((r) => ({
            ...r,
            journeyTemplateId: r['journeyTemplateId'] ?? 'jt-standard',
          }))
        : [],
    }),
  },
  {
    from: 3,
    to: 4,
    up: (s) => {
      // Mapping from the old i18n keys to resolved Swedish text.
      const KEY_TO_SV: Record<string, string> = {
        'questionnaire.numbness_fingers': 'Domningar i fingrar?',
        'questionnaire.numbness_toes': 'Domningar i tår?',
        'questionnaire.infection_wound': 'Tecken på infektion vid såret?',
        'questionnaire.infection_fever': 'Feber (>38°)?',
        'questionnaire.pain_now': 'Smärta just nu (0–10)',
        'questionnaire.wound_healed': 'Är såret läkt?',
        'questionnaire.wound_discharge': 'Sekret från såret?',
        'questionnaire.pain_night': 'Värsta smärtan natten (0–10)',
        'questionnaire.oss_pain': 'Smärta vid aktivitet (1=ingen, 5=svår)',
        'questionnaire.oss_washing': 'Kan du tvätta dig?',
        'questionnaire.oss_transport': 'Klara transporter?',
        'questionnaire.oss_dressing': 'Klä på dig?',
        'questionnaire.oss_shopping': 'Handla?',
        'questionnaire.eq_mobility': 'Rörlighet',
        'questionnaire.eq_selfcare': 'Egenvård',
        'questionnaire.eq_usual_activity': 'Vanliga aktiviteter',
        'questionnaire.eq_pain_discomfort': 'Smärta/obehag',
        'questionnaire.eq_anxiety': 'Oro/nedstämdhet',
        'questionnaire.eq_vas': 'Din hälsa idag (0=sämsta, 100=bästa möjliga)',
        'questionnaire.free_text': 'Övriga kommentarer (valfri)',
        'eq.level_1': 'Inga problem',
        'eq.level_2': 'Vissa problem',
        'eq.level_3': 'Stora problem',
      }
      const resolveLabel = (key: unknown): Record<string, string> => {
        const raw = typeof key === 'string' ? key : ''
        return { sv: KEY_TO_SV[raw] ?? raw }
      }
      return {
        ...s,
        schemaVersion: 4,
        questionnaireTemplates: Array.isArray(s['questionnaireTemplates'])
          ? (s['questionnaireTemplates'] as Record<string, unknown>[]).map((qt) => ({
              ...qt,
              questions: Array.isArray(qt['questions'])
                ? (qt['questions'] as Record<string, unknown>[]).map((q) => {
                    const { labelKey: _lk, ...rest } = q as Record<string, unknown>
                    return {
                      ...rest,
                      label: resolveLabel(_lk),
                      options: Array.isArray(q['options'])
                        ? (q['options'] as Record<string, unknown>[]).map((o) => {
                            const { labelKey: _ok, ...oRest } = o as Record<string, unknown>
                            return { ...oRest, label: resolveLabel(_ok) }
                          })
                        : undefined,
                    }
                  })
                : [],
            }))
          : [],
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

/**
 * Given raw JSON-parsed data from localStorage, walk the migration chain until
 * the state reaches CURRENT_SCHEMA_VERSION, then validate with Zod.
 *
 * Returns an `ok` result on success, or a typed `err` result that the caller
 * can use to show a blocking dialog.
 */
export function runMigrations(raw: unknown): MigrationResult {
  const asRecord = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  const storedVersion: number =
    typeof asRecord['schemaVersion'] === 'number' ? (asRecord['schemaVersion'] as number) : 0

  // Downgrade: stored data is from a newer app version
  if (storedVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, reason: 'downgrade', storedVersion, rawState: raw }
  }

  // Already current
  if (storedVersion === CURRENT_SCHEMA_VERSION) {
    const parsed = AppStateSchema.safeParse(raw)
    if (parsed.success) return { ok: true, state: parsed.data }
    return {
      ok: false,
      reason: 'parse-error',
      storedVersion,
      rawState: raw,
      parseError: parsed.error,
    }
  }

  // Walk the migration chain step by step
  let current: Record<string, unknown> = asRecord
  let version = storedVersion

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === version)
    if (!step) {
      return { ok: false, reason: 'no-path', storedVersion, rawState: raw }
    }
    current = step.up(current)
    version = step.to
  }

  const parsed = AppStateSchema.safeParse(current)
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'parse-error',
      storedVersion,
      rawState: raw,
      parseError: parsed.error,
    }
  }

  return { ok: true, state: parsed.data }
}
