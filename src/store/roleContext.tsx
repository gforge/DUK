import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { User } from '@/api/schemas'
import type { AuthSession, RoleContextValue } from '@/auth'
import { getAuthProvider } from '@/auth'

const authProvider = getAuthProvider()

function getInitialSession(): AuthSession | null {
  const existing = authProvider.getSession()
  if (existing) return existing

  if (import.meta.env.MODE === 'test') {
    const first = authProvider.getLoginOptions()[0]
    if (!first) return null
    return {
      id: 'test-fake-session',
      user: first.user,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
  }

  if (globalThis.window === undefined) {
    const first = authProvider.getLoginOptions()[0]
    if (!first) return null
    return {
      id: 'server-render-fake-session',
      user: first.user,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
  }

  return null
}

const RoleContext = createContext<RoleContextValue | null>(null)
const LoginContext = createContext<(userId: string) => Promise<void>>(async () => {
  throw new Error('useLogin must be used inside RoleProvider')
})

export function RoleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<AuthSession | null>(() => getInitialSession())

  const loginAs = useCallback(
    async (userId: string) => {
      setSession(await authProvider.loginAs(userId))
    },
    [],
  )

  const availableUsers = useMemo(
    () => authProvider.getLoginOptions().map((option) => option.user),
    [],
  )

  const value: RoleContextValue | null = useMemo(() => {
    if (!session) return null

    return {
      currentUser: session.user,
      setCurrentUser: (user: User) => {
        void authProvider.loginAs(user.id).then(setSession)
      },
      availableUsers,
      isRole: (...roles) => roles.includes(session.user.role),
      currentPatientId: session.user.patientId,
      session,
      authProviderName: authProvider.name,
      loginAs: async (userId: string) => {
        setSession(await authProvider.loginAs(userId))
      },
      logout: async () => {
        await authProvider.logout()
        setSession(null)
      },
    }
  }, [availableUsers, session])

  return (
    <LoginContext.Provider value={loginAs}>
      <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
    </LoginContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within an authenticated RoleProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalRole(): RoleContextValue | null {
  return useContext(RoleContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLogin(): (userId: string) => Promise<void> {
  return useContext(LoginContext)
}
