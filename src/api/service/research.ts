import type { ResearchModule } from '../schemas'
import { getStore, setStore } from '../storage'
import { now,uuid } from './utils'

export function getResearchModules(): ResearchModule[] {
  return getStore().researchModules
}

export function saveResearchModule(
  module: Omit<ResearchModule, 'id' | 'createdAt'> & { id?: string },
): ResearchModule {
  const state = getStore()
  const existing = module.id ? state.researchModules.find((m) => m.id === module.id) : null
  if (existing) {
    const updated: ResearchModule = { ...existing, ...module, id: existing.id }
    setStore({
      ...state,
      researchModules: state.researchModules.map((m) => (m.id === existing.id ? updated : m)),
    })
    return updated
  }
  const newModule: ResearchModule = { ...module, id: uuid(), createdAt: now() } as ResearchModule
  setStore({ ...state, researchModules: [...state.researchModules, newModule] })
  return newModule
}

export function deleteResearchModule(moduleId: string): void {
  const state = getStore()
  setStore({ ...state, researchModules: state.researchModules.filter((m) => m.id !== moduleId) })
}
