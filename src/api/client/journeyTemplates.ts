import * as service from '../service'
import type { JourneyTemplate } from '../schemas'
import { withDelay } from './delay'

export const getJourneyTemplates = (): Promise<JourneyTemplate[]> =>
  withDelay(() => service.getJourneyTemplates())

export const saveJourneyTemplate = (
  template: Omit<JourneyTemplate, 'id' | 'createdAt'> & { id?: string },
): Promise<JourneyTemplate> => withDelay(() => service.saveJourneyTemplate(template))

export const deleteJourneyTemplate = (templateId: string): Promise<void> =>
  withDelay(() => service.deleteJourneyTemplate(templateId))
