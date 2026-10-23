import type { AuthProviderAdapter, AuthSession, LoginOption } from './types'

const SESSION_KEY = 'duk.auth.fakeSession'

const nowIso = () => new Date().toISOString()

function expiresAt(): string {
  const date = new Date()
  date.setHours(date.getHours() + 8)
  return date.toISOString()
}

function sessionId(): string {
  return `fake-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const fakeLoginOptions: LoginOption[] = [
  {
    user: {
      id: 'user-pal-1',
      name: 'Dr. Sara Lindqvist',
      role: 'DOCTOR',
      hsaId: 'SE2321000016-1ABC',
      organizationId: 'org-demo-region',
      organizationName: 'Demo Region',
      careUnitId: 'unit-ortho',
      careUnitName: 'Ortopedmottagningen',
      assuranceLevel: 'fake',
      authMethod: 'fake',
    },
    description: 'PAL/doctor account with journal approval permissions.',
  },
  {
    user: {
      id: 'user-doc-1',
      name: 'Dr. Erik Bergstrom',
      role: 'DOCTOR',
      hsaId: 'SE2321000016-2DEF',
      organizationId: 'org-demo-region',
      organizationName: 'Demo Region',
      careUnitId: 'unit-ortho',
      careUnitName: 'Ortopedmottagningen',
      assuranceLevel: 'fake',
      authMethod: 'fake',
    },
    description: 'Doctor account for triage and clinical review.',
  },
  {
    user: {
      id: 'user-nurse-1',
      name: 'SSK Anna Holmberg',
      role: 'NURSE',
      hsaId: 'SE2321000016-3GHI',
      organizationId: 'org-demo-region',
      organizationName: 'Demo Region',
      careUnitId: 'unit-ortho',
      careUnitName: 'Ortopedmottagningen',
      assuranceLevel: 'fake',
      authMethod: 'fake',
    },
    description: 'Nurse account for triage, follow-up and contact actions.',
  },
  {
    user: {
      id: 'user-sec-1',
      name: 'Maria Lund (Sekreterare)',
      role: 'SECRETARY',
      hsaId: 'SE2321000016-4JKL',
      organizationId: 'org-demo-region',
      organizationName: 'Demo Region',
      careUnitId: 'unit-admin',
      careUnitName: 'Vardadministration',
      assuranceLevel: 'fake',
      authMethod: 'fake',
    },
    description: 'Secretary account for operational worklist coordination.',
  },
  {
    user: {
      id: 'user-patient-1',
      name: 'Anders Andersson',
      role: 'PATIENT',
      patientId: 'p-1',
      assuranceLevel: 'fake',
      authMethod: 'fake',
    },
    description: 'Patient portal account bound to one demo patient.',
  },
]

function readSession(): AuthSession | null {
  if (globalThis.window === undefined) return null
  try {
    const raw = globalThis.window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.id || new Date(parsed.expiresAt).getTime() <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: AuthSession): void {
  if (globalThis.window === undefined) return
  globalThis.window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const fakeAuthProvider: AuthProviderAdapter = {
  name: 'Fake local login',

  getSession() {
    return readSession()
  },

  getLoginOptions() {
    return fakeLoginOptions
  },

  async loginAs(userId: string) {
    const option = fakeLoginOptions.find((entry) => entry.user.id === userId)
    if (!option) throw new Error(`Unknown fake login user: ${userId}`)
    const session: AuthSession = {
      id: sessionId(),
      user: option.user,
      issuedAt: nowIso(),
      expiresAt: expiresAt(),
    }
    writeSession(session)
    return session
  },

  async logout() {
    if (globalThis.window === undefined) return
    globalThis.window.localStorage.removeItem(SESSION_KEY)
  },
}
