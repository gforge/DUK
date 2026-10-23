import type { CareTeam } from '../schemas'
import * as service from '../service'
import { withDelay } from './delay'

export const getCareTeams = (): Promise<CareTeam[]> => withDelay(() => service.getCareTeams())
