import * as service from '../service'
import type { QuestionnaireTemplate, FormSeries } from '../schemas'
import { withDelay } from './delay'

export const getQuestionnaireTemplates = (): Promise<QuestionnaireTemplate[]> =>
  withDelay(() => service.getQuestionnaireTemplates())

export const getFormSeries = (): Promise<FormSeries[]> => withDelay(() => service.getFormSeries())
