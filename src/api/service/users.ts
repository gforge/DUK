import { getStore } from '../storage'
import type { User } from '../schemas'

export function getUsers(): User[] {
  return getStore().users
}

export function getUser(userId: string): User | undefined {
  return getStore().users.find((u) => u.id === userId)
}
