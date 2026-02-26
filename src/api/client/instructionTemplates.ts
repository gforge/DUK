import * as service from '../service'
import type { InstructionTemplate } from '../schemas'
import { withDelay } from './delay'

export const getInstructionTemplates = (): Promise<InstructionTemplate[]> =>
  withDelay(() => service.getInstructionTemplates())

export const getInstructionTemplate = (id: string): Promise<InstructionTemplate | undefined> =>
  withDelay(() => service.getInstructionTemplate(id))

export const saveInstructionTemplate = (
  template: Omit<InstructionTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<InstructionTemplate> => withDelay(() => service.saveInstructionTemplate(template))

export const deleteInstructionTemplate = (id: string): Promise<void> =>
  withDelay(() => service.deleteInstructionTemplate(id))
