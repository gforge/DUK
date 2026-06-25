import { describe, expect, it } from 'vitest'

import { buildFakerSeed } from '@/api/seedFaker'
import { buildRealisticSeed } from '@/api/seedRealistic'

function isWorklistEligible(c: any): boolean {
  const mode = c.triageDecision?.contactMode
  if (mode === 'VISIT' || mode === 'PHONE' || mode === 'DIGITAL') return true
  if (
    c.nextStep === 'DOCTOR_VISIT' ||
    c.nextStep === 'NURSE_VISIT' ||
    c.nextStep === 'PHYSIO_VISIT' ||
    c.nextStep === 'PHONE_CALL' ||
    c.nextStep === 'DIGITAL_CONTROL'
  )
    return true
  return false
}

describe('Seed inspection', () => {
  it('realistic seed produces worklist-eligible cases', () => {
    const s = buildRealisticSeed()
    const total = s.cases.length
    const eligible = s.cases.filter((c: any) => isWorklistEligible(c)).length
    // Log for developer visibility when running tests locally

    console.log(`realistic seed: total=${total}, eligible=${eligible}`)
    expect(eligible).toBeGreaterThan(0)
  })

  it('faker seed produces worklist-eligible cases', async () => {
    const s = await buildFakerSeed()
    const total = s.cases.length
    const eligible = s.cases.filter((c: any) => isWorklistEligible(c)).length

    console.log(`faker seed: total=${total}, eligible=${eligible}`)
    expect(eligible).toBeGreaterThan(0)
  })
})
