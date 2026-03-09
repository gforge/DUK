import type { AppState } from './schemas'
import { AppStateSchema } from './schemas'
import { CURRENT_SCHEMA_VERSION } from './schemaVersion'

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
  {
    from: 4,
    to: 5,
    up: (s) => ({
      ...s,
      schemaVersion: 5,
      // Backfill pause tracking on all existing patient journeys.
      patientJourneys: Array.isArray(s['patientJourneys'])
        ? (s['patientJourneys'] as Record<string, unknown>[]).map((j) => ({
            ...j,
            pausedAt: j['pausedAt'] ?? null,
            totalPausedDays: j['totalPausedDays'] ?? 0,
          }))
        : [],
      // Backfill studyInfoMarkdown on all existing research modules.
      researchModules: Array.isArray(s['researchModules'])
        ? (s['researchModules'] as Record<string, unknown>[]).map((m) => ({
            ...m,
            studyInfoMarkdown: m['studyInfoMarkdown'] ?? '',
          }))
        : [],
      // Initialise empty consent log.
      researchConsents: s['researchConsents'] ?? [],
    }),
  },
  {
    from: 5,
    to: 6,
    up: (s) => ({
      ...s,
      schemaVersion: 6,
      // Backfill withdrawalReason on all existing consent records.
      researchConsents: Array.isArray(s['researchConsents'])
        ? (s['researchConsents'] as Record<string, unknown>[]).map((c) => ({
            ...c,
            withdrawalReason: c['withdrawalReason'] ?? null,
          }))
        : [],
    }),
  },
  {
    from: 6,
    to: 7,
    up: (s) => ({
      ...s,
      schemaVersion: 7,
      // Backfill reviews array on all existing cases.
      cases: Array.isArray(s['cases'])
        ? (s['cases'] as Record<string, unknown>[]).map((c) => ({
            ...c,
            reviews: c['reviews'] ?? [],
          }))
        : [],
    }),
  },
  {
    from: 7,
    to: 8,
    up: (s) => ({
      ...s,
      schemaVersion: 8,
      // `outcome` is optional on ClinicalReviewSchema — no backfill needed.
    }),
  },
  {
    from: 8,
    to: 9,
    up: (s) => ({
      ...s,
      schemaVersion: 9,
      // `journeyStepLabel` is optional on ClinicalReviewSchema — no backfill needed.
    }),
  },
  {
    from: 9,
    to: 10,
    up: (s) => {
      const nowIso = new Date().toISOString()

      const toIsoFromYmd = (ymd: unknown): string => {
        const text = typeof ymd === 'string' ? ymd : nowIso.slice(0, 10)
        const parsed = new Date(`${text}T00:00:00.000Z`)
        return Number.isNaN(parsed.getTime()) ? nowIso : parsed.toISOString()
      }

      const computePauseShift = (journey: Record<string, unknown>): number => {
        const total =
          typeof journey['totalPausedDays'] === 'number' ? Number(journey['totalPausedDays']) : 0
        const isSuspended = journey['status'] === 'SUSPENDED'
        const pausedAt = journey['pausedAt']
        if (!isSuspended || typeof pausedAt !== 'string') return total
        const currentPause = Math.floor((Date.now() - new Date(pausedAt).getTime()) / 86_400_000)
        return total + (Number.isNaN(currentPause) ? 0 : currentPause)
      }

      const journeyTemplates: Record<string, unknown>[] = Array.isArray(s['journeyTemplates'])
        ? (s['journeyTemplates'] as Record<string, unknown>[]).map((jt) => {
            const existing = Array.isArray(jt['instructions'])
              ? (jt['instructions'] as Record<string, unknown>[])
              : []

            return {
              ...jt,
              instructions: existing,
            } as Record<string, unknown>
          })
        : []

      const patientJourneys = Array.isArray(s['patientJourneys'])
        ? (s['patientJourneys'] as Record<string, unknown>[])
        : []

      const templateById = new Map<string, Record<string, unknown>>()
      for (const jt of journeyTemplates) {
        if (typeof jt['id'] === 'string') templateById.set(jt['id'], jt)
      }

      const instructions = patientJourneys.flatMap((journey) => {
        const journeyId = String(journey['id'] ?? '')
        const templateId = String(journey['journeyTemplateId'] ?? '')
        const template = templateById.get(templateId)
        const templateInstructions =
          template && Array.isArray(template['instructions'])
            ? (template['instructions'] as Record<string, unknown>[])
            : []

        const startDateIso = toIsoFromYmd(journey['startDate'])
        const startDateMs = new Date(startDateIso).getTime()
        const pauseShift = computePauseShift(journey)

        return templateInstructions.map((ti, idx) => {
          const startOffset =
            typeof ti['startDayOffset'] === 'number' ? Number(ti['startDayOffset']) : 0
          const endOffset =
            typeof ti['endDayOffset'] === 'number' ? Number(ti['endDayOffset']) : null
          const startAt = new Date(
            startDateMs + (startOffset + pauseShift) * 86_400_000,
          ).toISOString()
          const endAt =
            endOffset === null
              ? null
              : new Date(startDateMs + (endOffset + pauseShift) * 86_400_000).toISOString()

          return {
            id: `ins-migrated-${journeyId}-${idx}`,
            patientJourneyId: journeyId,
            journeyTemplateInstructionId:
              typeof ti['id'] === 'string' ? String(ti['id']) : undefined,
            instructionTemplateId: String(ti['instructionTemplateId'] ?? ''),
            label: typeof ti['label'] === 'string' ? ti['label'] : undefined,
            startDayOffset: startOffset,
            endDayOffset: endOffset === null ? undefined : endOffset,
            startAt,
            endAt,
            status: 'ACTIVE',
            tags: Array.isArray(ti['tags']) ? ti['tags'] : [],
            acknowledgedAt: null,
            acknowledgedByUserId: null,
            completedAt: null,
            completedByUserId: null,
            createdAt: nowIso,
            updatedAt: nowIso,
          }
        })
      })

      const formResponses = Array.isArray(s['formResponses'])
        ? (s['formResponses'] as Record<string, unknown>[]).map((fr) => ({
            ...fr,
            journeyTemplateEntryId: fr['journeyTemplateEntryId'] ?? undefined,
          }))
        : []

      return {
        ...s,
        schemaVersion: 10,
        journeyTemplates,
        patientJourneys,
        instructions,
        formResponses,
      }
    },
  },
  {
    from: 10,
    to: 11,
    up: (s) => {
      const nowIso = new Date().toISOString()

      // Group existing patient journeys by patientId so we can create one
      // synthetic EpisodeOfCare per patient (all phases lumped into a single episode).
      const journeys = Array.isArray(s['patientJourneys'])
        ? (s['patientJourneys'] as Record<string, unknown>[])
        : []

      // Build a map: patientId → first journey for that patient (chronological)
      const patientFirstJourney = new Map<string, Record<string, unknown>>()
      for (const j of journeys) {
        const pid = String(j['patientId'] ?? '')
        if (!patientFirstJourney.has(pid)) patientFirstJourney.set(pid, j)
      }

      // Create one episode per patient
      const episodesOfCare: Record<string, unknown>[] = []
      const episodeByPatient = new Map<string, string>() // patientId → episodeId
      let epIdx = 0
      for (const [pid, firstJourney] of patientFirstJourney) {
        const epId = `ep-migrated-${epIdx++}`
        const openedAt =
          typeof firstJourney['createdAt'] === 'string' ? firstJourney['createdAt'] : nowIso
        episodesOfCare.push({
          id: epId,
          patientId: pid,
          label: 'Uppföljning',
          status: 'OPEN',
          openedAt,
          closedAt: null,
          createdAt: openedAt,
          updatedAt: nowIso,
        })
        episodeByPatient.set(pid, epId)
      }

      // Backfill episodeId, phaseType, joinedAt on all existing patient journeys.
      // Strip any SWITCH_TEMPLATE modifications (replaced by new-journey-per-phase model).
      const updatedJourneys = journeys.map((j) => {
        const pid = String(j['patientId'] ?? '')
        const epId = episodeByPatient.get(pid) ?? ''
        const mods = Array.isArray(j['modifications'])
          ? (j['modifications'] as Record<string, unknown>[]).filter(
              (m) => m['type'] !== 'SWITCH_TEMPLATE',
            )
          : []
        return {
          ...j,
          episodeId: j['episodeId'] ?? epId,
          phaseType: j['phaseType'] ?? 'FOLLOWUP',
          joinedAt: j['joinedAt'] ?? '',
          modifications: mods,
        }
      })

      return {
        ...s,
        schemaVersion: 11,
        episodesOfCare:
          (s['episodesOfCare'] as Record<string, unknown>[] | undefined) ?? episodesOfCare,
        patientJourneys: updatedJourneys,
      }
    },
  },
  {
    from: 11,
    to: 12,
    up: (s) => {
      const mapLegacyToDecision = (c: Record<string, unknown>) => {
        const nextStep = c['nextStep']
        const assignedRole = c['assignedRole']
        const assignedUserId = c['assignedUserId']
        const deadline = c['deadline']
        const note = c['internalNote']

        if (typeof c['triageDecision'] === 'object' && c['triageDecision'] !== null) {
          return c['triageDecision']
        }

        if (nextStep === 'NO_ACTION') {
          return {
            contactMode: 'CLOSE',
            careRole: null,
            assignmentMode: null,
            assignedUserId: null,
            dueAt: null,
            note: typeof note === 'string' ? note : null,
          }
        }

        if (nextStep === 'PHONE_CALL') {
          return {
            contactMode: 'PHONE',
            careRole: assignedRole === 'DOCTOR' || assignedRole === 'PAL' ? 'DOCTOR' : 'NURSE',
            assignmentMode: assignedRole === 'PAL' ? 'PAL' : assignedUserId ? 'NAMED' : 'ANY',
            assignedUserId: typeof assignedUserId === 'string' ? assignedUserId : null,
            dueAt: typeof deadline === 'string' ? deadline : null,
            note: typeof note === 'string' ? note : null,
          }
        }

        if (nextStep === 'DIGITAL_CONTROL') {
          return {
            contactMode: 'DIGITAL',
            careRole: assignedRole === 'DOCTOR' || assignedRole === 'PAL' ? 'DOCTOR' : 'NURSE',
            assignmentMode: assignedRole === 'PAL' ? 'PAL' : assignedUserId ? 'NAMED' : 'ANY',
            assignedUserId: typeof assignedUserId === 'string' ? assignedUserId : null,
            dueAt: typeof deadline === 'string' ? deadline : null,
            note: typeof note === 'string' ? note : null,
          }
        }

        if (nextStep === 'PHYSIO_VISIT') {
          return {
            contactMode: 'VISIT',
            careRole: 'PHYSIO',
            assignmentMode: assignedUserId ? 'NAMED' : 'ANY',
            assignedUserId: typeof assignedUserId === 'string' ? assignedUserId : null,
            dueAt: typeof deadline === 'string' ? deadline : null,
            note: typeof note === 'string' ? note : null,
          }
        }

        const defaultCareRole =
          assignedRole === 'DOCTOR' || assignedRole === 'PAL'
            ? 'DOCTOR'
            : assignedRole === 'NURSE'
              ? 'NURSE'
              : 'DOCTOR'

        return {
          contactMode: 'VISIT',
          careRole: defaultCareRole,
          assignmentMode: assignedRole === 'PAL' ? 'PAL' : assignedUserId ? 'NAMED' : 'ANY',
          assignedUserId: typeof assignedUserId === 'string' ? assignedUserId : null,
          dueAt: typeof deadline === 'string' ? deadline : null,
          note: typeof note === 'string' ? note : null,
        }
      }

      return {
        ...s,
        schemaVersion: 12,
        cases: Array.isArray(s['cases'])
          ? (s['cases'] as Record<string, unknown>[]).map((c) => ({
              ...c,
              triageDecision: mapLegacyToDecision(c),
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
