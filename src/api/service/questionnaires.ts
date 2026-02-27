import { getStore, setStore } from '../storage'
import { uuid, now } from './utils'
import type { QuestionnaireTemplate, FormSeries } from '../schemas'

export function getQuestionnaireTemplates(): QuestionnaireTemplate[] {
  return getStore().questionnaireTemplates
}

export function saveQuestionnaireTemplate(
  template: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string },
): QuestionnaireTemplate {
  const state = getStore()
  const existing = template.id
    ? state.questionnaireTemplates.find((t) => t.id === template.id)
    : null
  if (existing) {
    const updated: QuestionnaireTemplate = { ...existing, ...template, id: existing.id }
    setStore({
      ...state,
      questionnaireTemplates: state.questionnaireTemplates.map((t) =>
        t.id === existing.id ? updated : t,
      ),
    })
    return updated
  }
  const newTemplate: QuestionnaireTemplate = {
    ...template,
    id: uuid(),
    createdAt: now(),
  } as QuestionnaireTemplate
  setStore({
    ...state,
    questionnaireTemplates: [...state.questionnaireTemplates, newTemplate],
  })
  return newTemplate
}

export function deleteQuestionnaireTemplate(templateId: string): void {
  const state = getStore()
  setStore({
    ...state,
    questionnaireTemplates: state.questionnaireTemplates.filter((t) => t.id !== templateId),
  })
}

export function getFormSeries(): FormSeries[] {
  return getStore().formSeries
}
