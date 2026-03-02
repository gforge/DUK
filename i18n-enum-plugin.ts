/**
 * i18n enum extraction plugin for i18next-cli.
 *
 * For every template literal `t(`prefix.${variable}`)` found in source files,
 * this plugin generates the concrete keys for each known enum value so that:
 *
 *  – Missing translations are automatically surfaced as __NOT_TRANSLATED__
 *    after the next `npm run generate:i18n` run.
 *  – Adding a new enum value to any TypeScript enum listed below is enough:
 *    you do not need to touch the locale files manually before the next run.
 *  – `preservePatterns` no longer needs to cover these namespaces, so stale
 *    keys for removed enum values are correctly cleaned up by the extractor.
 *
 * MAINTENANCE: when you add or rename a TypeScript enum value, update the
 * corresponding entry in ENUM_KEYS and run `npm run generate:i18n`.
 */

/** Maps the static template-literal prefix to the list of known enum values. */
const ENUM_KEYS: Record<string, readonly string[]> = {
  // src/api/schemas/enums.ts — CaseStatus
  'status.': ['CLOSED', 'FOLLOWING_UP', 'NEEDS_REVIEW', 'NEW', 'TRIAGED'],

  // src/api/schemas/enums.ts — Role
  'role.': ['DOCTOR', 'NURSE', 'PAL', 'PATIENT'],

  // src/api/schemas/enums.ts — CaseCategory
  'category.': ['ACUTE', 'CONTROL', 'SUBACUTE'],

  // src/api/schemas/policy.ts / case.ts — severity (shared LOW/MEDIUM/HIGH)
  'severity.': ['HIGH', 'LOW', 'MEDIUM'],

  // src/api/schemas/enums.ts — TriggerType
  'trigger.': [
    'ABNORMAL_ANSWER',
    'HIGH_PAIN',
    'INFECTION_SUSPECTED',
    'LOW_FUNCTION',
    'LOW_QOL',
    'NO_RESPONSE',
    'NOT_OPENED',
    'SEEK_CONTACT',
  ],

  // src/api/schemas/enums.ts — NextStep
  'nextStep.': [
    'DIGITAL_CONTROL',
    'DOCTOR_VISIT',
    'NO_ACTION',
    'NURSE_VISIT',
    'PHONE_CALL',
    'PHYSIO_VISIT',
  ],

  // src/api/schemas/journey.ts — PatientJourneyStatus
  'journey.journeyStatus.': ['ACTIVE', 'COMPLETED', 'SUSPENDED'],

  // JourneyTimeline.tsx — StepStatus (local type: SUBMITTED | UPCOMING | OVERDUE)
  'journey.status.': ['OVERDUE', 'SUBMITTED', 'UPCOMING'],

  // src/api/schemas/journey.ts — JourneyModificationType
  'journey.modType.': ['ADD_STEP', 'CANCEL', 'REMOVE_STEP', 'SWITCH_TEMPLATE'],

  // src/api/schemas/enums.ts — QuestionType
  'questionType.': ['BOOLEAN', 'NUMBER', 'SCALE', 'SELECT', 'TEXT'],

  // src/components/case/triage/actionConfig.ts — TriageActionKey
  'triage.actionLabel.': [
    'CLOSE_NOW',
    'DIGITAL_CONTROL',
    'DOCTOR_VISIT',
    'NURSE_VISIT',
    'PHONE_CALL',
    'PHYSIO_VISIT',
  ],
  'triage.actionDesc.': [
    'CLOSE_NOW',
    'DIGITAL_CONTROL',
    'DOCTOR_VISIT',
    'NURSE_VISIT',
    'PHONE_CALL',
    'PHYSIO_VISIT',
  ],
  'triage.actionRole.': [
    'CLOSE_NOW',
    'DIGITAL_CONTROL',
    'DOCTOR_VISIT',
    'NURSE_VISIT',
    'PHONE_CALL',
    'PHYSIO_VISIT',
  ],
  'triage.actionTooltip.': [
    'CLOSE_NOW',
    'DIGITAL_CONTROL',
    'DOCTOR_VISIT',
    'NURSE_VISIT',
    'PHONE_CALL',
    'PHYSIO_VISIT',
  ],
}

type TemplateLiteralNode = {
  type: 'TemplateLiteral'
  quasis: Array<{ cooked: string | null }>
  expressions: unknown[]
}

type AstExpression = { type: string } & Partial<TemplateLiteralNode>

/**
 * Returns an i18next-cli plugin that generates concrete translation keys for
 * all template-literal `t()` calls whose prefix matches a known enum namespace.
 */
export const enumExtractionPlugin = () => ({
  name: 'enum-extraction-plugin',

  /**
   * Called for every argument expression of a `t()` call in the source AST.
   * Returns concrete keys for recognised `prefix.${variable}` patterns.
   */
  extractKeysFromExpression: (expression: AstExpression): string[] => {
    if (expression.type !== 'TemplateLiteral') return []

    const { quasis, expressions } = expression as TemplateLiteralNode

    // Only handle the simple `prefix.${variable}` shape:
    // exactly 2 quasi segments (before and after the single placeholder).
    if (quasis.length !== 2 || expressions.length !== 1) return []

    const prefix = quasis[0].cooked
    if (!prefix) return []

    const suffix = quasis[1].cooked ?? ''

    const values = ENUM_KEYS[prefix]
    if (!values) return []

    return values.map((v) => `${prefix}${v}${suffix}`)
  },
})
