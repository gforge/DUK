import * as service from '../service'
import type { AppState } from '../schemas'
import type { SeedVariant } from '../service'
import { withDelay } from './delay'

export const exportState = (): Promise<AppState> => withDelay(() => service.exportState())

export const importState = (state: AppState): Promise<void> =>
  withDelay(() => service.importState(state))

export const resetAndReseed = (variant: SeedVariant = 'minimal'): Promise<void> =>
  service.resetAndReseed(variant)
