import '../i18n' // initialize translations for renderTemplate

import { describe, expect, it } from 'vitest'

import { renderTemplate } from '@/api/journalRenderer'

// minimal objects just to make the renderer happy
const BASE_PATIENT = { displayName: 'Test', dateOfBirth: '1990-01-01' } as any
const BASE_CASE = {
  category: 'ACUTE',
  status: 'NEW',
  nextStep: 'DOCTOR_VISIT',
  deadline: null,
  internalNote: null,
  patientMessage: null,
  triggers: [],
  policyWarnings: [],
} as any
const BASE_CTX = {
  patient: BASE_PATIENT,
  caseData: BASE_CASE,
  responses: [] as any[],
}

describe('journalRenderer translation helpers', () => {
  it('renders Swedish category, status and next step by default', () => {
    const tpl = '{{case.category}}|{{case.status}}|{{triage.nextStep}}'
    const out = renderTemplate(tpl, { ...BASE_CTX })
    expect(out).toContain('Akut')
    expect(out).toContain('Ny kontrollpunkt')
    expect(out).toContain('Läkarbesök')
  })

  it('switches to English when ctx.language is en', () => {
    const ctx = {
      ...BASE_CTX,
      caseData: {
        ...BASE_CASE,
        policyWarnings: [{ ruleName: 'foo', severity: 'HIGH' }],
      },
      language: 'en' as const,
    }
    const tpl = '{{policyWarnings.list}}'
    const out = renderTemplate(tpl, ctx as any)
    expect(out).toContain('foo (High)')
  })

  it('still falls back to Swedish when an unknown language is passed', () => {
    const out = renderTemplate('{{case.category}}', {
      ...BASE_CTX,
      language: 'xx' as any,
    } as any)
    expect(out).toContain('Akut')
  })
})
