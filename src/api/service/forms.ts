import type { Case, FormResponse, TriggerType } from '@/api/schemas'
import { getStore, setStore } from '@/api/storage'

import { buildPolicyScopeWithAliases } from './journeyResolver'
import { addAuditEvent, computeScores, evaluatePolicyRules, now, uuid } from './utils'

export function getFormResponses(caseId: string): FormResponse[] {
  return getStore().formResponses.filter((r) => r.caseId === caseId)
}

export function getFormResponsesByJourney(journeyId: string): FormResponse[] {
  return getStore().formResponses.filter((r) => r.patientJourneyId === journeyId)
}

export interface JourneyStepContext {
  patientJourneyId: string
  /** Base entry id (not the __r0 expanded variant). */
  journeyTemplateEntryId: string
  occurrenceIndex: number
}

export function submitFormResponse(
  patientId: string,
  caseId: string,
  templateId: string,
  answers: Record<string, string | number | boolean>,
  journeyContext?: JourneyStepContext,
): FormResponse {
  let state = getStore()
  const template = state.questionnaireTemplates.find((t) => t.id === templateId)!
  const scores = template ? computeScores(template, answers) : {}

  const allResponses = state.formResponses.filter((r) => r.caseId === caseId)
  const scope = buildPolicyScopeWithAliases(allResponses, patientId)
  Object.entries(answers).forEach(([k, v]) => (scope[k] = Number(v)))
  Object.entries(scores).forEach(([k, v]) => (scope[k] = v))
  const warnings = evaluatePolicyRules(state.policyRules, scope)

  const triggers: TriggerType[] = []
  if (Number(answers['PNRS_2'] ?? answers['PNRS_1'] ?? 0) >= 7) triggers.push('HIGH_PAIN')
  if (answers['INF_WOUND'] === true || answers['INF_FEVER'] === true)
    triggers.push('INFECTION_SUSPECTED')
  if (scores['OSS.total'] && scores['OSS.total'] < 30) triggers.push('LOW_FUNCTION')
  if (scores['EQ5D.index'] && scores['EQ5D.index'] < 0.5) triggers.push('LOW_QOL')

  const response: FormResponse = {
    id: uuid(),
    patientId,
    caseId,
    templateId,
    answers,
    scores,
    submittedAt: now(),
    ...(journeyContext && {
      patientJourneyId: journeyContext.patientJourneyId,
      journeyTemplateEntryId: journeyContext.journeyTemplateEntryId,
      occurrenceIndex: journeyContext.occurrenceIndex,
    }),
  }

  const existingCase = state.cases.find((c) => c.id === caseId)!
  const updatedCase: Case = {
    ...existingCase,
    triggers: [...new Set([...existingCase.triggers, ...triggers])],
    policyWarnings: warnings,
    lastActivityAt: now(),
    status: existingCase.status === 'NEW' ? 'NEEDS_REVIEW' : existingCase.status,
  }

  // If linked to a recurring step, record the completion so the next occurrence
  // is re-anchored relative to today.
  let patientJourneys = state.patientJourneys
  if (journeyContext) {
    const journey = patientJourneys.find((j) => j.id === journeyContext.patientJourneyId)
    const tmpl = journey
      ? state.journeyTemplates.find((t) => t.id === journey.journeyTemplateId)
      : undefined
    const entry = tmpl?.entries.find((e) => e.id === journeyContext.journeyTemplateEntryId)
    if (journey && entry?.recurrenceIntervalDays !== undefined) {
      const alreadyRecorded = (journey.recurringCompletions ?? []).some(
        (c) =>
          c.stepId === journeyContext.journeyTemplateEntryId &&
          c.occurrenceIndex === journeyContext.occurrenceIndex,
      )
      if (!alreadyRecorded) {
        const updatedJourney = {
          ...journey,
          recurringCompletions: [
            ...(journey.recurringCompletions ?? []),
            {
              stepId: journeyContext.journeyTemplateEntryId,
              occurrenceIndex: journeyContext.occurrenceIndex,
              completedAt: now().slice(0, 10),
            },
          ],
          updatedAt: now(),
        }
        patientJourneys = patientJourneys.map((j) => (j.id === journey.id ? updatedJourney : j))
      }
    }
  }

  state = {
    ...state,
    formResponses: [...state.formResponses, response],
    cases: state.cases.map((c) => (c.id === caseId ? updatedCase : c)),
    patientJourneys,
  }
  state = addAuditEvent(state, caseId, patientId, 'PATIENT', 'FORM_SUBMITTED', {
    templateId,
    scores,
    triggersAdded: triggers,
  })
  setStore(state)
  return response
}

export function seekContact(patientId: string, caseId: string): Case {
  let state = getStore()
  const existing = state.cases.find((c) => c.id === caseId)
  if (!existing) throw new Error('Case not found')
  const updated: Case = {
    ...existing,
    triggers: [...new Set([...existing.triggers, 'SEEK_CONTACT' as TriggerType])],
    lastActivityAt: now(),
    status: existing.status === 'NEW' ? 'NEEDS_REVIEW' : existing.status,
  }
  state = { ...state, cases: state.cases.map((c) => (c.id === caseId ? updated : c)) }
  state = addAuditEvent(state, caseId, patientId, 'PATIENT', 'SEEK_CONTACT', {})
  setStore(state)
  return updated
}
