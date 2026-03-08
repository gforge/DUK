import { afterEach,beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore, resetStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

afterEach(() => {
  resetStore()
})

describe('grantConsent', () => {
  it('creates a new consent record', () => {
    const consent = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    expect(consent.patientId).toBe('p-1')
    expect(consent.researchModuleId).toBe('rm-move-2026')
    expect(consent.patientJourneyId).toBe('pj-1')
    expect(consent.revokedAt).toBeNull()
    expect(consent.grantedByUserId).toBe('user-pal-1')
  })

  it('is idempotent — returns existing consent if already active', () => {
    const first = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    const second = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    expect(first.id).toBe(second.id)

    const all = service.getResearchConsents('p-1')
    expect(all).toHaveLength(1)
  })
})

describe('revokeConsent', () => {
  it('sets revokedAt and revokedByUserId', () => {
    const consent = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    const revoked = service.revokeConsent(consent.id, 'user-doctor-1')
    expect(revoked.revokedAt).toBeTruthy()
    expect(revoked.revokedByUserId).toBe('user-doctor-1')
  })

  it('throws for unknown consent id', () => {
    expect(() => service.revokeConsent('no-such-id', 'user-1')).toThrow()
  })
})

describe('hasActiveConsent', () => {
  it('returns false when no consent exists', () => {
    expect(service.hasActiveConsent('p-1', 'rm-move-2026', 'pj-1')).toBe(false)
  })

  it('returns true after granting', () => {
    service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    expect(service.hasActiveConsent('p-1', 'rm-move-2026', 'pj-1')).toBe(true)
  })

  it('returns false after revoking', () => {
    const consent = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    service.revokeConsent(consent.id, 'user-pal-1')
    expect(service.hasActiveConsent('p-1', 'rm-move-2026', 'pj-1')).toBe(false)
  })
})

describe('getActiveConsent', () => {
  it('returns undefined when there is no active consent', () => {
    expect(service.getActiveConsent('p-1', 'rm-move-2026', 'pj-1')).toBeUndefined()
  })

  it('returns the consent after granting', () => {
    service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    const c = service.getActiveConsent('p-1', 'rm-move-2026', 'pj-1')
    expect(c).toBeTruthy()
    expect(c!.revokedAt).toBeNull()
  })

  it('returns undefined after revoking', () => {
    const consent = service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    service.revokeConsent(consent.id, 'user-pal-1')
    expect(service.getActiveConsent('p-1', 'rm-move-2026', 'pj-1')).toBeUndefined()
  })
})

describe('getResearchConsents', () => {
  it('filters by patientId', () => {
    service.grantConsent('p-1', 'rm-move-2026', 'pj-1', 'user-pal-1')
    service.grantConsent('p-2', 'rm-move-2026', 'pj-2', 'user-pal-1')
    const p1Consents = service.getResearchConsents('p-1')
    expect(p1Consents.every((c) => c.patientId === 'p-1')).toBe(true)
    expect(p1Consents).toHaveLength(1)
  })
})
