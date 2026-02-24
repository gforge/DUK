import React, { createContext, useContext, useState } from 'react'
import type { Role, User } from '../api/schemas'

const DEMO_USERS: User[] = [
  { id: 'user-pal-1', name: 'Dr. Sara Lindqvist (PAL)', role: 'PAL' },
  { id: 'user-doc-1', name: 'Dr. Erik Bergström', role: 'DOCTOR' },
  { id: 'user-nurse-1', name: 'SSK Anna Holmberg', role: 'NURSE' },
  { id: 'user-nurse-2', name: 'SSK Jonas Ekström', role: 'NURSE' },
  { id: 'user-patient-1', name: 'Anders Andersson', role: 'PATIENT' },
]

interface RoleContextValue {
  currentUser: User
  setCurrentUser: (user: User) => void
  availableUsers: User[]
  isRole: (...roles: Role[]) => boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0])

  const value: RoleContextValue = {
    currentUser,
    setCurrentUser,
    availableUsers: DEMO_USERS,
    isRole: (...roles) => roles.includes(currentUser.role),
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
