/**
 * Safe Mustache-like template renderer.
 *
 * Supported syntax:
 *   {{token}}           — render a whitelisted value
 *   {{#if FLAG}}...{{/if}}  — conditional block on whitelisted boolean flags
 *
 * NO eval, NO user-defined helpers, NO arbitrary expressions.
 */

import type { Case, FormResponse, Patient, PolicyWarning } from './schemas'
import type { NextStep, TriggerType } from './schemas'

// Whitelisted token paths
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

export interface TemplateContext {
  patient: Patient
  caseData: Case
  latestResponse: FormResponse | null
}

function buildScope(ctx: TemplateContext): Record<string, string> {
  const { patient, caseData, latestResponse } = ctx
  const scores = latestResponse?.scores ?? {}
  const answers = latestResponse?.answers ?? {}
  const warnings: PolicyWarning[] = caseData.policyWarnings ?? []

  const getScore = (key: string): string => {
    if (key in scores) return String(scores[key])
    if (key in answers) return String(answers[key])
    return 'N/A'
  }

  return {
    'patient.displayName': patient.displayName,
    'patient.dateOfBirth': patient.dateOfBirth,
    'case.category': caseData.category,
    'case.status': caseData.status,
    'scores.PNRS_1': getScore('PNRS_1'),
    'scores.PNRS_2': getScore('PNRS_2'),
    'scores.PNRS_NIGHT': getScore('PNRS_NIGHT'),
    'scores.OSS.total': getScore('OSS.total'),
    'scores.EQ5D.index': getScore('EQ5D.index'),
    'scores.EQ_VAS': getScore('EQ_VAS'),
    'policyWarnings.list':
      warnings.length > 0
        ? warnings.map((w) => `${w.ruleName} (${w.severity})`).join(', ')
        : 'None',
    'triage.nextStep': (caseData.nextStep as NextStep | undefined) ?? 'Not set',
    'triage.deadline': caseData.deadline
      ? new Date(caseData.deadline).toLocaleDateString('sv-SE')
      : 'Not set',
    'triage.internalNote': caseData.internalNote ?? '',
    'triage.patientMessage': caseData.patientMessage ?? '',
  }
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
        return `[Invalid flag: ${flag}]`
      }
      return flags[flag] ? body : ''
    },
  )

  // 2. Process {{token}} replacements
  result = result.replace(/\{\{([\w.]+)\}\}/g, (_match: string, token: string): string => {
    if (!WHITELIST_TOKENS.has(token)) {
      return `[Unknown token: ${token}]`
    }
    return scope[token] ?? ''
  })

  return result
}
