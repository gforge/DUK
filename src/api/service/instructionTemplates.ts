import type { InstructionTemplate } from '../schemas'
import { getStore, setStore } from '../storage'
import { now,uuid } from './utils'

export function getInstructionTemplates(): InstructionTemplate[] {
  return getStore().instructionTemplates ?? []
}

export function getInstructionTemplate(id: string): InstructionTemplate | undefined {
  return getInstructionTemplates().find((t) => t.id === id)
}

export function saveInstructionTemplate(
  template: Omit<InstructionTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): InstructionTemplate {
  const state = getStore()
  const templates = state.instructionTemplates ?? []
  const existing = template.id ? templates.find((t) => t.id === template.id) : null

  if (existing) {
    const updated: InstructionTemplate = {
      ...existing,
      ...template,
      id: existing.id,
      updatedAt: now(),
    }
    setStore({
      ...state,
      instructionTemplates: templates.map((t) => (t.id === existing.id ? updated : t)),
    })
    return updated
  }

  const newTemplate: InstructionTemplate = {
    ...template,
    id: uuid(),
    createdAt: now(),
    updatedAt: now(),
    tags: template.tags ?? [],
  }
  setStore({ ...state, instructionTemplates: [...templates, newTemplate] })
  return newTemplate
}

export function deleteInstructionTemplate(id: string): void {
  const state = getStore()
  setStore({
    ...state,
    instructionTemplates: (state.instructionTemplates ?? []).filter((t) => t.id !== id),
  })
}
