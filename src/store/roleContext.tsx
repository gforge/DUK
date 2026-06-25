import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Role, User } from '../api/schemas'

const CURRENT_USER_STORAGE_KEY = 'duk_current_user_id'

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
  logout: () => void
  availableUsers: User[]
  isLoggedIn: boolean
  isRole: (...roles: Role[]) => boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

function getInitialUser(): User {
  try {
    const savedUserId = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    return DEMO_USERS.find((user) => user.id === savedUserId) ?? DEMO_USERS[0]
  } catch {
    return DEMO_USERS[0]
  }
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User>(getInitialUser)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem(CURRENT_USER_STORAGE_KEY) !== null
    } catch {
      return false
    }
  })

  const value: RoleContextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: User) => {
        setCurrentUserState(user)
        setIsLoggedIn(true)
        try {
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.id)
        } catch {
          // Ignore storage failures; the in-memory role still changes for this session.
        }
      },
      logout: () => {
        setIsLoggedIn(false)
        try {
          localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
        } catch {
          // Ignore storage failures; logout still clears the in-memory session.
        }
      },
      availableUsers: DEMO_USERS,
      isLoggedIn,
      isRole: (...roles) => isLoggedIn && roles.includes(currentUser.role),
    }),
    [currentUser, isLoggedIn],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
