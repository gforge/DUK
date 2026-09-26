import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'

import type { JourneyTemplate } from '@/api/schemas'
import { SEED_STATE } from '@/api/seed'
import {
  attachInstructions,
  computeCustomisation,
  findSearchHit,
  getPhases,
  groupTemplates,
  inferOffsetUnit,
  JourneyTemplatesTab,
  resolveGroup,
  sortedEntries,
  sortedInstructions,
} from '@/components/journey/editor'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

const templates = SEED_STATE.journeyTemplates
const byId = new Map(templates.map((t) => [t.id, t]))
const ctx = {
  questionnaires: new Map(SEED_STATE.questionnaireTemplates.map((q) => [q.id, q])),
  instructionTemplates: new Map(SEED_STATE.instructionTemplates.map((i) => [i.id, i])),
}

function tpl(partial: Partial<JourneyTemplate>): JourneyTemplate {
  return {
    id: 'x',
    name: 'X',
    entries: [],
    instructions: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    referenceDateLabel: 'Startdatum',
    ...partial,
  }
}

describe('journey template browser helpers', () => {
  it('groups seeded templates and orders care-pathway phases', () => {
    const groups = groupTemplates(templates)
    const knee = groups.find((g) => g.label === 'Knäartros')
    expect(knee?.phased).toBe(true)
    expect(knee?.templates.map((t) => t.phaseOrder)).toEqual([1, 2, 3])
    const fractures = groups.find((g) => g.label === 'Frakturer')
    expect(fractures?.templates.map((t) => t.id)).toContain('jt-distal-radius')
    expect(getPhases(knee!.templates[1], groups)).toHaveLength(3)
    expect(getPhases(fractures!.templates[0], groups)).toHaveLength(0)
  })

  it('falls back to the parent group, then the name prefix, then ungrouped', () => {
    const parent = tpl({ id: 'p', name: 'Base', group: 'Frakturer' })
    const child = tpl({ id: 'c', name: 'Child', parentTemplateId: 'p' })
    const prefixed = tpl({ id: 'n', name: 'Höft — Remissfas' })
    const lone = tpl({ id: 'l', name: 'Lone' })
    const map = new Map([parent, child, prefixed, lone].map((t) => [t.id, t]))
    expect(resolveGroup(child, map)).toBe('Frakturer')
    expect(resolveGroup(prefixed, map)).toBe('Höft')
    expect(resolveGroup(lone, map)).toBeNull()
    const groups = groupTemplates([lone, parent, child])
    expect(groups[groups.length - 1]?.label).toBeNull()
  })

  it('finds search hits in steps, forms and instructions', () => {
    const standard = byId.get('jt-standard')!
    expect(findSearchHit(standard, 'standardfraktur', ctx)).toEqual({ kind: 'template' })
    const firstEntry = sortedEntries(standard)[0]
    expect(findSearchHit(standard, firstEntry.label, ctx)).toMatchObject({ kind: 'step' })
    expect(findSearchHit(standard, 'zzzz-no-match', ctx)).toBeNull()
    const withForm = sortedEntries(standard).find((e) => e.templateId)!
    const hit = findSearchHit(
      tpl({ entries: [{ ...withForm, label: 'L' }] }),
      withForm.templateId!,
      ctx,
    )
    expect(hit).toMatchObject({ kind: 'form' })
  })

  it('attaches instructions to the step at or before their start', () => {
    const standard = byId.get('jt-standard')!
    const entries = sortedEntries(standard)
    const instructions = sortedInstructions(standard)
    const map = attachInstructions(entries, instructions)
    const total = [...map.values()].reduce((n, l) => n + l.length, 0)
    expect(total).toBe(instructions.length)
    for (const [entryId, list] of map) {
      const idx = entries.findIndex((e) => e.id === entryId)
      for (const instr of list) {
        if (idx > 0) expect(entries[idx].offsetDays).toBeLessThanOrEqual(instr.startDayOffset)
        const next = entries[idx + 1]
        if (next) expect(instr.startDayOffset).toBeLessThan(next.offsetDays)
      }
    }
  })

  it('flags customised steps of a derived template', () => {
    const parent = tpl({
      id: 'p',
      entries: [
        {
          id: 'a',
          label: 'Vecka 4',
          offsetDays: 28,
          windowDays: 3,
          order: 0,
          scoreAliases: {},
          scoreAliasLabels: {},
          dashboardCategory: 'CONTROL',
        },
      ],
    })
    const child = tpl({
      id: 'c',
      parentTemplateId: 'p',
      entries: [
        { ...parent.entries[0], id: 'a2' },
        { ...parent.entries[0], id: 'b2', label: 'Vecka 3', offsetDays: 21 },
      ],
    })
    const { customEntryIds } = computeCustomisation(child, parent)
    expect([...customEntryIds]).toEqual(['b2'])
  })

  it('infers the largest exact offset unit', () => {
    expect(inferOffsetUnit(0)).toBe('days')
    expect(inferOffsetUnit(28)).toBe('weeks')
    expect(inferOffsetUnit(90)).toBe('months')
    expect(inferOffsetUnit(730)).toBe('years')
    expect(inferOffsetUnit(10)).toBe('days')
  })
})

describe('JourneyTemplatesTab', () => {
  function setup() {
    const user = userEvent.setup()
    render(
      <I18nextProvider i18n={i18n}>
        <SnackProvider>
          <JourneyTemplatesTab
            journeyTemplates={templates}
            loading={false}
            onDelete={vi.fn()}
            patientJourneys={SEED_STATE.patientJourneys}
            questionnaires={SEED_STATE.questionnaireTemplates}
            instructionTemplates={SEED_STATE.instructionTemplates}
          />
        </SnackProvider>
      </I18nextProvider>,
    )
    return user
  }

  it('shows grouped templates and the first template in detail', () => {
    setup()
    const aside = screen.getByRole('complementary')
    expect(within(aside).getByRole('button', { name: /Knäartros/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: templates[0].name })).toBeInTheDocument()
  })

  it('filters the list when searching and shows an empty state', async () => {
    const user = setup()
    const search = screen.getByRole('searchbox', {
      name: i18n.t('journey.editor.browser.searchAll'),
    })
    await user.type(search, 'qqqxyz')
    expect(
      screen.getByText(i18n.t('journey.editor.browser.noSearchHits', { query: 'qqqxyz' })),
    ).toBeInTheDocument()
  })

  it('switches phase from the care pathway chips', async () => {
    const user = setup()
    const aside = screen.getByRole('complementary')
    await user.click(within(aside).getAllByRole('button', { name: /Remissfas/ })[0])
    const pathway = screen.getByRole('navigation', {
      name: i18n.t('journey.editor.browser.carePathway'),
    })
    const chips = within(pathway).getAllByRole('button')
    expect(chips.length).toBeGreaterThan(1)
    await user.click(chips[1])
    expect(within(pathway).getAllByRole('button')[1]).toHaveAttribute('aria-current', 'step')
  })

  it('opens the step drawer from the edit button', async () => {
    const user = setup()
    const editLabel = i18n.t('journey.editor.browser.editStep')
    const [firstEdit] = screen.getAllByRole('button', { name: new RegExp(`^${editLabel}:`) })
    await user.click(firstEdit)
    const drawer = await screen.findByRole('presentation')
    expect(within(drawer).getByText(i18n.t('journey.editor.editEntry'))).toBeInTheDocument()
    expect(
      within(drawer).getByRole('button', { name: i18n.t('journey.editor.stepDrawer.deleteStep') }),
    ).toBeInTheDocument()
  })
})
