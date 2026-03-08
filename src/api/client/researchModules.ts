import type { ResearchModule } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getResearchModules = (): Promise<ResearchModule[]> =>
  withDelay(() => service.getResearchModules())

export const saveResearchModule = (
  module: Omit<ResearchModule, 'id' | 'createdAt'> & { id?: string },
): Promise<ResearchModule> => withDelay(() => service.saveResearchModule(module))

export const deleteResearchModule = (moduleId: string): Promise<void> =>
  withDelay(() => service.deleteResearchModule(moduleId))
