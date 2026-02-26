import * as service from '../service'
import type { JourneyTemplate } from '../schemas'
import type { EntryDiff, PolicyVariable } from '../service'
import { withDelay } from './delay'

export const getJourneyTemplates = (): Promise<JourneyTemplate[]> =>
  withDelay(() => service.getJourneyTemplates())

export const saveJourneyTemplate = (
  template: Omit<JourneyTemplate, 'id' | 'createdAt'> & { id?: string },
): Promise<JourneyTemplate> => withDelay(() => service.saveJourneyTemplate(template))

export const deleteJourneyTemplate = (templateId: string): Promise<void> =>
  withDelay(() => service.deleteJourneyTemplate(templateId))

export const deriveJourneyTemplate = (
  parentId: string,
  newName: string,
): Promise<JourneyTemplate> => withDelay(() => service.deriveJourneyTemplate(parentId, newName))

export const computeParentDiff = (childId: string): Promise<EntryDiff[]> =>
  withDelay(() => service.computeParentDiff(childId))

export const applyParentDiff = (childId: string, entryIds: string[]): Promise<JourneyTemplate> =>
  withDelay(() => service.applyParentDiff(childId, entryIds))

export const getAvailablePolicyVariables = (): Promise<PolicyVariable[]> =>
  withDelay(() => service.getAvailablePolicyVariables())
