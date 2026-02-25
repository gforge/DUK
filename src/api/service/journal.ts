import { getStore, setStore } from '../storage'
import { uuid, now, addAuditEvent } from './utils'
import { getEffectiveSteps } from './journeyResolver'
import { renderTemplate } from '../journalRenderer'
import type { AppState, JournalDraft, JournalTemplate, Role } from '../schemas'

export function getJournalDrafts(caseId: string): JournalDraft[] {
  return getStore().journalDrafts.filter((d) => d.caseId === caseId)
}

export function getJournalTemplates(): JournalTemplate[] {
  return getStore().journalTemplates
}

export function getJournalTemplatesByLanguage(language: string): JournalTemplate[] {
  const all = getStore().journalTemplates
  const filtered = all.filter((t) => (t.language ?? 'sv') === language)
  return filtered.length > 0 ? filtered : all
}

export function generateJournalDraft(
  caseId: string,
  templateId: string,
  userId: string,
  userRole: Role,
  language = 'sv',
): JournalDraft {
  const state = getStore()
  const caseData = state.cases.find((c) => c.id === caseId)!
  const patient = state.patients.find((p) => p.id === caseData.patientId)!
  const template = state.journalTemplates.find((t) => t.id === templateId)!
  const responses = state.formResponses
    .filter((r) => r.caseId === caseId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const activeJourney = state.patientJourneys
    .filter((j) => j.patientId === caseData.patientId && j.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const aliasedScores: Record<string, { value: string; label: string }> = {}
  if (activeJourney) {
    for (const step of getEffectiveSteps(activeJourney.id)) {
      const stepResponses = responses
        .filter((r) => r.templateId === step.templateId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      const stepLatest = stepResponses[0]
      if (!stepLatest) continue
      for (const [rawKey, alias] of Object.entries(step.scoreAliases)) {
        const numVal =
          stepLatest.scores[rawKey] !== undefined
            ? stepLatest.scores[rawKey]
            : Number(stepLatest.answers[rawKey])
        if (!isNaN(numVal))
          aliasedScores[alias] = {
            value: String(numVal),
            label: step.scoreAliasLabels?.[alias] ?? alias,
          }
      }
    }
  }

  const content = renderTemplate(template.body, {
    patient,
    caseData,
    responses,
    aliasedScores,
    language: template.language ?? language,
  })

  const draft: JournalDraft = {
    id: uuid(),
    caseId,
    templateId,
    content,
    status: 'DRAFT',
    createdByUserId: userId,
    createdAt: now(),
    updatedAt: now(),
  }
  let newState: AppState = { ...state, journalDrafts: [...state.journalDrafts, draft] }
  newState = addAuditEvent(newState, caseId, userId, userRole, 'JOURNAL_DRAFT_CREATED', {
    templateId,
    language,
  })
  setStore(newState)
  return draft
}

export function approveJournalDraft(draftId: string, userId: string, userRole: Role): JournalDraft {
  let state = getStore()
  const draft = state.journalDrafts.find((d) => d.id === draftId)
  if (!draft) throw new Error('Draft not found')
  const updated: JournalDraft = {
    ...draft,
    status: 'APPROVED',
    approvedByUserId: userId,
    approvedAt: now(),
    updatedAt: now(),
  }
  state = {
    ...state,
    journalDrafts: state.journalDrafts.map((d) => (d.id === draftId ? updated : d)),
  }
  state = addAuditEvent(state, draft.caseId, userId, userRole, 'JOURNAL_DRAFT_APPROVED', {
    draftId,
  })
  setStore(state)
  return updated
}
