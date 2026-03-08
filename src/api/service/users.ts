import type { User } from '../schemas'
import { getStore } from '../storage'

export function getUsers(): User[] {
  return getStore().users
}

export function getUser(userId: string): User | undefined {
  return getStore().users.find((u) => u.id === userId)
}
