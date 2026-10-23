import { describe, expect, it } from 'vitest'

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

  it('SEED_STATE (minimal) includes explorable demo content', () => {
    expect(SEED_STATE.patients.length).toBeGreaterThan(0)
    expect(SEED_STATE.cases.length).toBeGreaterThan(0)
    expect(SEED_STATE.policyRules.length).toBeGreaterThan(0)
    expect(SEED_STATE.journeyTemplates.length).toBeGreaterThan(0)
    expect(SEED_STATE.questionnaireTemplates.length).toBeGreaterThan(0)
    expect(SEED_STATE.journalTemplates.length).toBeGreaterThan(0)
    expect(SEED_STATE.researchModules.length).toBeGreaterThan(0)
    expect(SEED_STATE.instructionTemplates.length).toBeGreaterThan(0)
  })

  it('SEED_STATE includes domain-specific orthopaedic PROM templates', () => {
    const templateIds = new Set(SEED_STATE.questionnaireTemplates.map((t) => t.id))
    expect([...templateIds]).toEqual(
      expect.arrayContaining([
        'qt-function-prwe-short',
        'qt-eq5d-prwe-short',
        'qt-function-oks-short',
        'qt-eq5d-oks-short',
        'qt-function-moxfq-short',
        'qt-eq5d-moxfq-short',
      ]),
    )

    const distalRadius = SEED_STATE.journeyTemplates.find((t) => t.id === 'jt-distal-radius')
    expect(distalRadius?.entries.some((e) => e.templateId === 'qt-function-prwe-short')).toBe(true)
    expect(distalRadius?.entries.some((e) => e.templateId === 'qt-eq5d-prwe-short')).toBe(true)

    const kneePostop = SEED_STATE.journeyTemplates.find((t) => t.id === 'jt-knee-postop')
    expect(kneePostop?.entries.some((e) => e.templateId === 'qt-function-oks-short')).toBe(true)
    expect(kneePostop?.entries.some((e) => e.templateId === 'qt-eq5d-oks-short')).toBe(true)

    const hindfootPostop = SEED_STATE.journeyTemplates.find((t) => t.id === 'jt-hindfoot-postop')
    expect(hindfootPostop?.entries.some((e) => e.templateId === 'qt-function-moxfq-short')).toBe(
      true,
    )
    expect(hindfootPostop?.entries.some((e) => e.templateId === 'qt-eq5d-moxfq-short')).toBe(true)
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
