import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { initStore, resetStore } from '@/api/storage'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

afterEach(() => {
  resetStore()
})

describe('journey instructions', () => {
  it('instantiates patient instructions when journey template defines template instructions', () => {
    const baseTemplate = service.getJourneyTemplates()[0]

    service.saveJourneyTemplate({
      ...baseTemplate,
      instructions: [
        {
          id: 'jti-test-1',
          journeyTemplateId: baseTemplate.id,
          instructionTemplateId: 'it-wound-care',
          label: 'Wear sling',
          startDayOffset: 0,
          endDayOffset: 14,
          order: 1,
          tags: ['sling'],
        },
      ],
    })

    const journey = service.assignPatientJourney('p-1', baseTemplate.id, '2026-01-01')
    const instructions = service.getInstructions(journey.id)

    expect(instructions).toHaveLength(1)
    expect(instructions[0].journeyTemplateInstructionId).toBe('jti-test-1')
    expect(instructions[0].instructionTemplateId).toBe('it-wound-care')
    expect(instructions[0].startAt).toBe('2026-01-01T00:00:00.000Z')
    expect(instructions[0].endAt).toBe('2026-01-15T00:00:00.000Z')
  })

  it('supports ad hoc instruction creation and schedule override', () => {
    const journey = service.getPatientJourneys('p-1')[0]

    const created = service.addJourneyInstruction(journey.id, {
      instructionTemplateId: 'it-post-op-general',
      startDayOffset: 3,
      endDayOffset: 21,
      label: 'Custom schedule',
      tags: ['custom'],
    })

    expect(created.startAt).toContain('T00:00:00.000Z')
    expect(created.status).toBe('ACTIVE')

    const updated = service.updateInstructionSchedule(created.id, {
      startDayOffset: 7,
      endDayOffset: 28,
    })

    expect(updated.startDayOffset).toBe(7)
    expect(updated.endDayOffset).toBe(28)
    expect(updated.startAt).toContain('T00:00:00.000Z')
  })

  it('supports acknowledge, complete, and cancel lifecycle transitions', () => {
    const journey = service.getPatientJourneys('p-1')[0]
    const created = service.addJourneyInstruction(journey.id, {
      instructionTemplateId: 'it-post-op-general',
      startDayOffset: 1,
    })

    const acknowledged = service.acknowledgeInstruction(created.id, 'user-nurse-1')
    expect(acknowledged.status).toBe('ACKNOWLEDGED')
    expect(acknowledged.acknowledgedAt).toBeTruthy()

    const completed = service.completeInstruction(created.id, 'user-doctor-1')
    expect(completed.status).toBe('COMPLETED')
    expect(completed.completedAt).toBeTruthy()

    const cancelled = service.cancelInstruction(created.id)
    expect(cancelled.status).toBe('CANCELLED')
  })

  it('hydrates resolved instruction content from instruction templates', () => {
    const journey = service.getPatientJourneys('p-1')[0]
    service.addJourneyInstruction(journey.id, {
      instructionTemplateId: 'it-post-op-general',
      startDayOffset: 0,
    })

    const resolved = service.getResolvedInstructionsForJourney(journey.id)
    expect(resolved.length).toBeGreaterThan(0)
    expect(resolved[0].content.length).toBeGreaterThan(0)
  })
})
