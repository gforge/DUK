import type { Role, User } from '@/api/schemas'

export type AssuranceLevel = 'fake' | 'loa2' | 'loa3' | 'loa4'

export interface AuthenticatedUser extends User {
  patientId?: string
  organizationId?: string
  organizationName?: string
  careUnitId?: string
  careUnitName?: string
  hsaId?: string
  assuranceLevel: AssuranceLevel
  authMethod: 'fake' | 'grand-id' | 'siths' | 'oidc' | 'saml'
}

export interface AuthSession {
  id: string
  user: AuthenticatedUser
  issuedAt: string
  expiresAt: string
}

export interface LoginOption {
  user: AuthenticatedUser
  description: string
}

export interface AuthProviderAdapter {
  name: string
  getSession(): AuthSession | null
  getLoginOptions(): LoginOption[]
  loginAs(userId: string): Promise<AuthSession>
  logout(): Promise<void>
}

export interface RoleContextValue {
  currentUser: AuthenticatedUser
  setCurrentUser: (user: User) => void
  availableUsers: AuthenticatedUser[]
  isRole: (...roles: Role[]) => boolean
  currentPatientId?: string
  session: AuthSession
  authProviderName: string
  loginAs: (userId: string) => Promise<void>
  logout: () => Promise<void>
}
