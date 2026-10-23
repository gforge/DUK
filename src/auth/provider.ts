import { fakeAuthProvider } from './fakeAuthProvider'
import type { AuthProviderAdapter } from './types'

// Production builds can replace this factory with a GrandID/SITHS/OIDC/SAML
// adapter while keeping the rest of the app on the same session contract.
export function getAuthProvider(): AuthProviderAdapter {
  return fakeAuthProvider
}
