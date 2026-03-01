import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Role, User } from '../api/schemas'

const DEMO_USERS: User[] = [
  { id: 'user-pal-1', name: 'Dr. Sara Lindqvist (PAL)', role: 'PAL' },
  { id: 'user-doc-1', name: 'Dr. Erik Bergström', role: 'DOCTOR' },
  { id: 'user-nurse-1', name: 'SSK Anna Holmberg', role: 'NURSE' },
  { id: 'user-nurse-2', name: 'SSK Jonas Ekström', role: 'NURSE' },
  { id: 'user-patient-1', name: 'Anders Andersson', role: 'PATIENT' },
]

const PATIENT_USER_TO_PATIENT_ID: Record<string, string> = {
  'user-patient-1': 'p-1',
}

const LAST_SELECTED_USER_KEY = 'duk.selectedUserId'

interface RoleContextValue {
  currentUser: User
  setCurrentUser: (user: User) => void
  availableUsers: User[]
  isRole: (...roles: Role[]) => boolean
  currentPatientId?: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (globalThis.window === undefined) return DEMO_USERS[0]
    const storedId = globalThis.window.localStorage.getItem(LAST_SELECTED_USER_KEY)
    const storedUser = storedId ? DEMO_USERS.find((u) => u.id === storedId) : undefined
    return storedUser ?? DEMO_USERS[0]
  })

  const patientId = PATIENT_USER_TO_PATIENT_ID[currentUser.id]

  const value: RoleContextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      availableUsers: DEMO_USERS,
      isRole: (...roles) => roles.includes(currentUser.role),
      currentPatientId: patientId,
    }),
    [currentUser, patientId],
  )

  useEffect(() => {
    if (globalThis.window === undefined) return
    globalThis.window.localStorage.setItem(LAST_SELECTED_USER_KEY, currentUser.id)
  }, [currentUser.id])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
