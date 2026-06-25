import { getStore, setStore } from '../storage'
import type { AppState } from '../schemas'
import { SEED_STATE } from '../seed'

export type SeedVariant = 'minimal' | 'realistic' | 'faker'

export function exportState(): AppState {
  return getStore()
}

export function importState(state: AppState): void {
  setStore(state)
}

export async function resetAndReseed(variant: SeedVariant = 'minimal'): Promise<void> {
  if (variant === 'realistic') {
    const { buildRealisticSeed } = await import('../seedRealistic')
    setStore(buildRealisticSeed())
  } else if (variant === 'faker') {
    const { buildFakerSeed } = await import('../seedFaker')
    setStore(await buildFakerSeed())
  } else {
    setStore(SEED_STATE)
  }
}
