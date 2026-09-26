import { CssBaseline, ThemeProvider } from '@mui/material'
import React, { useState } from 'react'
import { MemoryRouter, useInRouterContext } from 'react-router-dom'

import { fakeLoginOptions } from '@/auth'
import i18n from '@/i18n'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'
import { theme } from '@/theme'

const SESSION_KEY = 'duk.auth.fakeSession'

type DukUserId =
  | 'user-pal-1'
  | 'user-doc-1'
  | 'user-nurse-1'
  | 'user-sec-1'
  | 'user-patient-1'

interface DukProviderProps {
  children: React.ReactNode
  /** UI language. The app defaults to Swedish. */
  lang?: 'sv' | 'en'
  /**
   * Demo user the session is signed in as. Drives role-gated UI (nav items,
   * global search). `user-nurse-1` = nurse, `user-pal-1` / `user-doc-1` =
   * doctor, `user-sec-1` = secretary, `user-patient-1` = patient.
   */
  userId?: DukUserId
  /** Initial in-memory route; SideNav highlights the matching item. */
  initialPath?: string
}

function seedSession(userId: DukUserId) {
  const option = fakeLoginOptions.find((o) => o.user.id === userId) ?? fakeLoginOptions[0]
  const now = new Date()
  const session = {
    id: `design-${userId}`,
    user: option.user,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
  }
  try {
    globalThis.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // storage blocked: RoleProvider starts signed-out
  }
}

/**
 * Root wrapper for every DUK screen: MUI theme + CssBaseline, i18n language,
 * an in-memory router, a signed-in demo session (RoleProvider) and the
 * snackbar context. Components that read the current user, route or
 * translations throw or render unstyled without it.
 */
export function DukProvider({
  children,
  lang = 'sv',
  userId = 'user-nurse-1',
  initialPath = '/dashboard',
}: DukProviderProps) {
  const inRouter = useInRouterContext()
  useState(() => {
    seedSession(userId)
    if (i18n.language !== lang) void i18n.changeLanguage(lang)
    return null
  })
  const tree = (
    <RoleProvider key={userId}>
      <SnackProvider>{children}</SnackProvider>
    </RoleProvider>
  )
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {inRouter ? (
        tree
      ) : (
        <MemoryRouter initialEntries={[initialPath]}>{tree}</MemoryRouter>
      )}
    </ThemeProvider>
  )
}
