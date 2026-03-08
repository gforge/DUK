import type { FormSeries,QuestionnaireTemplate } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getQuestionnaireTemplates = (): Promise<QuestionnaireTemplate[]> =>
  withDelay(() => service.getQuestionnaireTemplates())

export const saveQuestionnaireTemplate = (
  template: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string },
): Promise<QuestionnaireTemplate> => withDelay(() => service.saveQuestionnaireTemplate(template))

export const deleteQuestionnaireTemplate = (templateId: string): Promise<void> =>
  withDelay(() => service.deleteQuestionnaireTemplate(templateId))

export const getFormSeries = (): Promise<FormSeries[]> => withDelay(() => service.getFormSeries())
