import { afterEach, describe, expect, it, vi } from 'vitest'

import * as service from '@/api/service'
import { initStore, resetStore } from '@/api/storage'

afterEach(() => {
  vi.useRealTimers()
  resetStore()
})

describe('minimal reseed date anchoring', () => {
  it('rebuilds minimal seed relative to current day on reseed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2032-05-10T12:00:00.000Z'))

    initStore(
      await (async () => {
        const { buildMinimalSeed } = await import('@/api/seed')
        return buildMinimalSeed(new Date('2026-01-01T12:00:00.000Z'))
      })(),
    )

    await service.resetAndReseed('minimal')
    const state = service.exportState()
    const pj1 = state.patientJourneys.find((j) => j.id === 'pj-1')

    expect(pj1).toBeDefined()
    expect(pj1?.startDate).toBe('2032-04-26')
  })
})
