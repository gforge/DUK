import { getStore } from '../storage'
import type { QuestionnaireTemplate, FormSeries } from '../schemas'

export function getQuestionnaireTemplates(): QuestionnaireTemplate[] {
  return getStore().questionnaireTemplates
}

export function getFormSeries(): FormSeries[] {
  return getStore().formSeries
}
