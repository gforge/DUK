import { getStore, setStore } from '../storage'
import { uuid, now } from './utils'
import type { JourneyTemplate } from '../schemas'

export function getJourneyTemplates(): JourneyTemplate[] {
  return getStore().journeyTemplates
}

export function saveJourneyTemplate(
  template: Omit<JourneyTemplate, 'id' | 'createdAt'> & { id?: string },
): JourneyTemplate {
  const state = getStore()
  const existing = template.id ? state.journeyTemplates.find((t) => t.id === template.id) : null
  if (existing) {
    const updated: JourneyTemplate = { ...existing, ...template, id: existing.id }
    setStore({
      ...state,
      journeyTemplates: state.journeyTemplates.map((t) => (t.id === existing.id ? updated : t)),
    })
    return updated
  }
  const newTemplate: JourneyTemplate = {
    ...template,
    id: uuid(),
    createdAt: now(),
  } as JourneyTemplate
  setStore({ ...state, journeyTemplates: [...state.journeyTemplates, newTemplate] })
  return newTemplate
}

export function deleteJourneyTemplate(templateId: string): void {
  const state = getStore()
  setStore({
    ...state,
    journeyTemplates: state.journeyTemplates.filter((t) => t.id !== templateId),
  })
}
