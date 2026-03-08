import type { Instruction } from '../schemas'
import type { ResolvedInstruction } from '../service/instructions'
import * as service from '../service'
import { withDelay } from './delay'

export const getInstructions = (patientJourneyId?: string): Promise<Instruction[]> =>
  withDelay(() => service.getInstructions(patientJourneyId))

export const getResolvedInstructionsForJourney = (
  journeyId: string,
): Promise<ResolvedInstruction[]> =>
  withDelay(() => service.getResolvedInstructionsForJourney(journeyId))

export const addJourneyInstruction = (
  patientJourneyId: string,
  input: {
    instructionTemplateId: string
    startDayOffset: number
    endDayOffset?: number
    label?: string
    tags?: string[]
    journeyTemplateInstructionId?: string
  },
): Promise<Instruction> => withDelay(() => service.addJourneyInstruction(patientJourneyId, input))

export const updateInstructionSchedule = (
  instructionId: string,
  schedule: { startDayOffset: number; endDayOffset?: number },
): Promise<Instruction> =>
  withDelay(() => service.updateInstructionSchedule(instructionId, schedule))

export const acknowledgeInstruction = (
  instructionId: string,
  userId: string,
): Promise<Instruction> => withDelay(() => service.acknowledgeInstruction(instructionId, userId))

export const completeInstruction = (instructionId: string, userId: string): Promise<Instruction> =>
  withDelay(() => service.completeInstruction(instructionId, userId))

export const cancelInstruction = (instructionId: string): Promise<Instruction> =>
  withDelay(() => service.cancelInstruction(instructionId))
