import { describe, expect,it } from 'vitest'

import { AppStateSchema } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import { buildFakerSeed } from '@/api/seedFaker'
import { buildRealisticSeed } from '@/api/seedRealistic'

describe('Seed data — AppStateSchema validation', () => {
  it('SEED_STATE (minimal) passes schema', () => {
    const result = AppStateSchema.safeParse(SEED_STATE)
    if (!result.success) {
      // Print the full error tree for easier debugging
      expect.fail(result.error.toString())
    }
    expect(result.success).toBe(true)
  })

  it('buildRealisticSeed() passes schema', () => {
    const result = AppStateSchema.safeParse(buildRealisticSeed())
    if (!result.success) {
      expect.fail(result.error.toString())
    }
    expect(result.success).toBe(true)
  })

  it('buildFakerSeed() passes schema', async () => {
    const state = await buildFakerSeed()
    const result = AppStateSchema.safeParse(state)
    if (!result.success) {
      expect.fail(result.error.toString())
    }
    expect(result.success).toBe(true)
  })
})
