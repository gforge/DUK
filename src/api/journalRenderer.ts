/**
 * Safe Mustache-like template renderer.
 *
 * Supported syntax:
 *   {{token}}               — render a whitelisted value
 *   {{score.ALIAS}}         — render a numeric value from journey score aliases
 *   {{label.ALIAS}}         — render a human-readable label for a journey alias
 *   {{#if FLAG}}...{{/if}} — conditional block on whitelisted boolean flags
 *
 * NO eval, NO user-defined helpers, NO arbitrary expressions.
 */

import type { Case, FormResponse, Patient, PolicyWarning } from './schemas'
import type { TriggerType } from './schemas'

// Locale-aware translation maps for enum values rendered into journal text
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  sv: { ACUTE: 'Akut', SUBACUTE: 'Subakut' },
  en: { ACUTE: 'Acute', SUBACUTE: 'Subacute' },
}
const NEXT_STEP_LABELS: Record<string, Record<string, string>> = {
  sv: {
    DIGITAL_CONTROL: 'Digital kontroll',
    DOCTOR_VISIT: 'Läkarbesök',
    NO_ACTION: 'Ingen åtgärd',
  },
  en: { DIGITAL_CONTROL: 'Digital check-up', DOCTOR_VISIT: 'Doctor visit', NO_ACTION: 'No action' },
}
const SEVERITY_LABELS: Record<string, Record<string, string>> = {
  sv: { HIGH: 'Hög', MEDIUM: 'Medel', LOW: 'Låg' },
  en: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
}

function tr(map: Record<string, Record<string, string>>, lang: string, key: string): string {
  return (map[lang] ?? map['sv'])[key] ?? key
}

// Whitelisted static token paths (backward compat)
const WHITELIST_TOKENS = new Set([
  'patient.displayName',
  'patient.dateOfBirth',
  'case.category',
  'case.status',
  'scores.PNRS_1',
  'scores.PNRS_2',
  'scores.PNRS_NIGHT',
  'scores.OSS.total',
  'scores.EQ5D.index',
  'scores.EQ_VAS',
  'policyWarnings.list',
  'triage.nextStep',
  'triage.deadline',
  'triage.internalNote',
  'triage.patientMessage',
])

// Whitelisted if-flags
const WHITELIST_FLAGS = new Set<string>([
  'triggers.HIGH_PAIN',
  'triggers.INFECTION_SUSPECTED',
  'triggers.NO_RESPONSE',
  'triggers.NOT_OPENED',
  'triggers.LOW_FUNCTION',
  'triggers.LOW_QOL',
  'triggers.SEEK_CONTACT',
  'triggers.ABNORMAL_ANSWER',
])

/**
 * Per-alias resolved data from the patient's journey steps.
 * Populated by the service layer from scoreAliases + scoreAliasLabels.
 */
export type AliasedScore = {
  value: string // formatted numeric value, e.g. "3"
  label: string // human-readable label, e.g. "VAS (PNRS) vid vecka 4"
}

export interface TemplateContext {
  patient: Patient
  caseData: Case
  /**
   * All form responses for the case, sorted newest-first.
   * buildScope aggregates across all of them so that scores from earlier
   * questionnaire steps are not lost when a newer response is submitted.
   */
  responses: FormResponse[]
  /** Resolved score aliases for this patient's journey, keyed by alias name. */
  aliasedScores?: Record<string, AliasedScore>
  /** BCP-47 language tag used for translating enum values in output. Defaults to 'sv'. */
  language?: string
}

function buildScope(ctx: TemplateContext): Record<string, string> {
  const { patient, caseData, responses, aliasedScores, language = 'sv' } = ctx
  const warnings: PolicyWarning[] = caseData.policyWarnings ?? []

  // Aggregate score / answer values across all responses (newest-first).
  // Each individual questionnaire step only captures a subset of keys, so we
  // need to scan all responses to find the most-recent value for each key.
  const getScore = (key: string): string => {
    for (const r of responses) {
      if (key in r.scores) return String(r.scores[key])
      if (key in r.answers) return String(r.answers[key])
    }
    return '–'
  }

  const staticScope: Record<string, string> = {
    'patient.displayName': patient.displayName,
    'patient.dateOfBirth': patient.dateOfBirth,
    'case.category': tr(CATEGORY_LABELS, language, caseData.category),
    'case.status': caseData.status,
    'scores.PNRS_1': getScore('PNRS_1'),
    'scores.PNRS_2': getScore('PNRS_2'),
    'scores.PNRS_NIGHT': getScore('PNRS_NIGHT'),
    'scores.OSS.total': getScore('OSS.total'),
    'scores.EQ5D.index': getScore('EQ5D.index'),
    'scores.EQ_VAS': getScore('EQ_VAS'),
    'policyWarnings.list':
      warnings.length > 0
        ? warnings
            .map((w) => `${w.ruleName} (${tr(SEVERITY_LABELS, language, w.severity)})`)
            .join(', ')
        : language === 'en'
          ? 'None'
          : 'Inga',
    'triage.nextStep': caseData.nextStep
      ? tr(NEXT_STEP_LABELS, language, caseData.nextStep as string)
      : language === 'en'
        ? 'Not set'
        : 'Ej satt',
    'triage.deadline': caseData.deadline
      ? new Date(caseData.deadline).toLocaleDateString(language === 'en' ? 'en-GB' : 'sv-SE')
      : language === 'en'
        ? 'Not set'
        : 'Ej satt',
    'triage.internalNote': caseData.internalNote ?? '',
    'triage.patientMessage': caseData.patientMessage ?? '',
  }

  // Inject dynamic score.ALIAS and label.ALIAS tokens from journey alias resolution
  if (aliasedScores) {
    for (const [alias, { value, label }] of Object.entries(aliasedScores)) {
      staticScope[`score.${alias}`] = value
      staticScope[`label.${alias}`] = label
    }
  }

  return staticScope
}

function buildFlags(caseData: Case): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  const triggers = caseData.triggers as TriggerType[]
  WHITELIST_FLAGS.forEach((flagKey) => {
    const triggerName = flagKey.replace('triggers.', '') as TriggerType
    flags[flagKey] = triggers.includes(triggerName)
  })
  return flags
}

export function renderTemplate(template: string, ctx: TemplateContext): string {
  const scope = buildScope(ctx)
  const flags = buildFlags(ctx.caseData)

  // 1. Process {{#if FLAG}}...{{/if}} blocks
  let result = template.replace(
    /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match: string, flag: string, body: string): string => {
      if (!WHITELIST_FLAGS.has(flag)) {
        return `[Ogiltig flag: ${flag}]`
      }
      return flags[flag] ? body : ''
    },
  )

  // 2. Process {{token}} replacements
  // Dynamic prefixes score.* and label.* are validated against the runtime scope.
  // All other tokens must be in the static whitelist.
  result = result.replace(/\{\{([\w.]+)\}\}/g, (_match: string, token: string): string => {
    if (token.startsWith('score.') || token.startsWith('label.')) {
      return token in scope ? scope[token] : `[Okänd variabel: ${token}]`
    }
    if (!WHITELIST_TOKENS.has(token)) {
      return `[Okänd variabel: ${token}]`
    }
    return scope[token] ?? ''
  })

  return result
}
