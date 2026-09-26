import { describe, expect, it } from 'vitest'

import { buildMinimalSeed } from '@/api/seed'

const TODAY = new Date('2032-05-10T12:00:00.000Z')

describe('referral phase seed examples', () => {
  const state = buildMinimalSeed(TODAY)
  const referenced = (ids: string[], pool: { id: string }[]) =>
    ids.every((id) => pool.some((x) => x.id === id))

  it('1: registered referral without diagnosis, journey or booking', () => {
    const episode = state.episodesOfCare.find((e) => e.id === 'ep-ref-1')
    expect(episode?.referral?.diagnoses).toEqual([])
    expect(state.patientJourneys.some((j) => j.patientId === 'p-24')).toBe(false)
    expect(state.cases.find((c) => c.id === 'case-ref-1')?.bookings).toBeUndefined()
  })

  it('2: forms sent but unanswered, visit booked', () => {
    const journey = state.patientJourneys.find((j) => j.id === 'pj-ref-2')
    expect(journey?.status).toBe('ACTIVE')
    expect(journey?.startDate).toBe('2032-05-06')
    expect(state.formResponses.some((r) => r.patientJourneyId === 'pj-ref-2')).toBe(false)
    const booking = state.cases.find((c) => c.id === 'case-ref-2')?.bookings?.[0]
    expect(booking?.status).toBe('SCHEDULED')
    expect(new Date(booking!.scheduledAt).getTime()).toBeGreaterThan(TODAY.getTime())
  })

  it('3: forms answered, visit booked', () => {
    const responses = state.formResponses.filter((r) => r.patientJourneyId === 'pj-ref-3')
    expect(responses.map((r) => r.templateId).sort()).toEqual([
      'qt-function-ohs-short',
      'qt-preop-intake',
    ])
    const booking = state.cases.find((c) => c.id === 'case-ref-3')?.bookings?.[0]
    expect(new Date(booking!.scheduledAt).getTime()).toBeGreaterThan(TODAY.getTime())
  })

  it('referral journeys only reference existing templates, forms and instructions', () => {
    for (const id of ['jt-hip-referral', 'jt-knee-referral', 'jt-hindfoot-referral']) {
      const template = state.journeyTemplates.find((t) => t.id === id)!
      expect(
        referenced(
          template.entries.flatMap((e) => (e.templateId ? [e.templateId] : [])),
          state.questionnaireTemplates,
        ),
      ).toBe(true)
      expect(
        referenced(
          template.instructions.map((i) => i.instructionTemplateId),
          state.instructionTemplates,
        ),
      ).toBe(true)
    }
  })
})
