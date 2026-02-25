import { getStore } from '../storage'
import type { User } from '../schemas'

export function getUsers(): User[] {
  return getStore().users
}
