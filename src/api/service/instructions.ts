import type { Instruction, PatientJourney } from '../schemas'
import { getStore, setStore } from '../storage'
import { computeTotalPauseShift, toScheduledDate } from './journeyDates'
import { now, uuid } from './utils'

export interface ResolvedInstruction extends Instruction {
  content: string
  templateName?: string
  isActiveNow: boolean
}

interface CreateInstructionInput {
  instructionTemplateId: string
  startDayOffset: number
  endDayOffset?: number
  label?: string
  tags?: string[]
  journeyTemplateInstructionId?: string
}

interface UpdateInstructionScheduleInput {
  startDayOffset: number
  endDayOffset?: number
}

export function getInstructions(patientJourneyId?: string): Instruction[] {
  const all = getStore().instructions ?? []
  const filtered = patientJourneyId
    ? all.filter((i) => i.patientJourneyId === patientJourneyId)
    : all
  return filtered
    .slice()
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.createdAt.localeCompare(b.createdAt))
}

export function getResolvedInstructionsForJourney(journeyId: string): ResolvedInstruction[] {
  const state = getStore()
  const templates = state.instructionTemplates ?? []
  const currentIso = now()

  return getInstructions(journeyId).map((instruction) => {
    const tpl = templates.find((t) => t.id === instruction.instructionTemplateId)
    const afterStart = currentIso >= instruction.startAt
    const beforeEnd = !instruction.endAt || currentIso <= instruction.endAt
    const isActiveNow =
      instruction.status !== 'CANCELLED' &&
      instruction.status !== 'COMPLETED' &&
      afterStart &&
      beforeEnd

    return {
      ...instruction,
      content: tpl?.content ?? '',
      templateName: tpl?.name,
      isActiveNow,
    }
  })
}

export function addJourneyInstruction(
  patientJourneyId: string,
  input: CreateInstructionInput,
): Instruction {
  const state = getStore()
  const journey = state.patientJourneys.find((j) => j.id === patientJourneyId)
  if (!journey) throw new Error(`Journey ${patientJourneyId} not found`)

  const template = state.instructionTemplates.find((t) => t.id === input.instructionTemplateId)
  if (!template) throw new Error(`Instruction template ${input.instructionTemplateId} not found`)

  const { startAt, endAt } = resolveInstructionDates(
    journey.startDate,
    journey,
    input.startDayOffset,
    input.endDayOffset,
  )

  const created: Instruction = {
    id: uuid(),
    patientJourneyId,
    journeyTemplateInstructionId: input.journeyTemplateInstructionId,
    instructionTemplateId: input.instructionTemplateId,
    label: input.label,
    startDayOffset: input.startDayOffset,
    endDayOffset: input.endDayOffset,
    startAt,
    endAt,
    status: 'ACTIVE',
    tags: input.tags ?? [],
    acknowledgedAt: null,
    acknowledgedByUserId: null,
    completedAt: null,
    completedByUserId: null,
    createdAt: now(),
    updatedAt: now(),
  }

  setStore({
    ...state,
    instructions: [...(state.instructions ?? []), created],
  })

  return created
}

export function updateInstructionSchedule(
  instructionId: string,
  schedule: UpdateInstructionScheduleInput,
): Instruction {
  const state = getStore()
  const instruction = (state.instructions ?? []).find((i) => i.id === instructionId)
  if (!instruction) throw new Error(`Instruction ${instructionId} not found`)

  const journey = state.patientJourneys.find((j) => j.id === instruction.patientJourneyId)
  if (!journey) throw new Error(`Journey ${instruction.patientJourneyId} not found`)

  const { startAt, endAt } = resolveInstructionDates(
    journey.startDate,
    journey,
    schedule.startDayOffset,
    schedule.endDayOffset,
  )

  const updated: Instruction = {
    ...instruction,
    startDayOffset: schedule.startDayOffset,
    endDayOffset: schedule.endDayOffset,
    startAt,
    endAt,
    updatedAt: now(),
  }

  setStore({
    ...state,
    instructions: (state.instructions ?? []).map((i) => (i.id === instructionId ? updated : i)),
  })

  return updated
}

export function acknowledgeInstruction(instructionId: string, userId: string): Instruction {
  return patchInstruction(instructionId, (instruction) => ({
    ...instruction,
    status: instruction.status === 'COMPLETED' ? instruction.status : 'ACKNOWLEDGED',
    acknowledgedAt: instruction.acknowledgedAt ?? now(),
    acknowledgedByUserId: instruction.acknowledgedByUserId ?? userId,
    updatedAt: now(),
  }))
}

export function completeInstruction(instructionId: string, userId: string): Instruction {
  return patchInstruction(instructionId, (instruction) => ({
    ...instruction,
    status: 'COMPLETED',
    completedAt: now(),
    completedByUserId: userId,
    acknowledgedAt: instruction.acknowledgedAt ?? now(),
    acknowledgedByUserId: instruction.acknowledgedByUserId ?? userId,
    updatedAt: now(),
  }))
}

export function cancelInstruction(instructionId: string): Instruction {
  return patchInstruction(instructionId, (instruction) => ({
    ...instruction,
    status: 'CANCELLED',
    updatedAt: now(),
  }))
}

function patchInstruction(
  instructionId: string,
  updater: (instruction: Instruction) => Instruction,
): Instruction {
  const state = getStore()
  const current = (state.instructions ?? []).find((i) => i.id === instructionId)
  if (!current) throw new Error(`Instruction ${instructionId} not found`)

  const updated = updater(current)

  setStore({
    ...state,
    instructions: (state.instructions ?? []).map((i) => (i.id === instructionId ? updated : i)),
  })

  return updated
}

function resolveInstructionDates(
  journeyStartDate: string,
  journey: PatientJourney,
  startDayOffset: number,
  endDayOffset?: number,
): { startAt: string; endAt: string | null } {
  const startMs = new Date(journeyStartDate).getTime()
  const shift = computeTotalPauseShift(journey)

  const startAtDate = toScheduledDate(startMs, startDayOffset, shift)
  const endAtDate =
    endDayOffset === undefined ? null : toScheduledDate(startMs, endDayOffset, shift)

  return {
    startAt: `${startAtDate}T00:00:00.000Z`,
    endAt: endAtDate ? `${endAtDate}T00:00:00.000Z` : null,
  }
}
