import * as service from '../service'
import type { QuestionnaireTemplate, FormSeries } from '../schemas'
import { withDelay } from './delay'

export const getQuestionnaireTemplates = (): Promise<QuestionnaireTemplate[]> =>
  withDelay(() => service.getQuestionnaireTemplates())

export const saveQuestionnaireTemplate = (
  template: Omit<QuestionnaireTemplate, 'id' | 'createdAt'> & { id?: string },
): Promise<QuestionnaireTemplate> => withDelay(() => service.saveQuestionnaireTemplate(template))

export const deleteQuestionnaireTemplate = (templateId: string): Promise<void> =>
  withDelay(() => service.deleteQuestionnaireTemplate(templateId))

export const getFormSeries = (): Promise<FormSeries[]> => withDelay(() => service.getFormSeries())
