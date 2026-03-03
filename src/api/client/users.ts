import * as service from '../service'
import type { User } from '../schemas'
import { withDelay } from './delay'

export const getUsers = (): Promise<User[]> => withDelay(() => service.getUsers())

export const getUser = (userId: string): Promise<User | undefined> =>
  withDelay(() => service.getUser(userId))
