import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeAll, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { initStore, patchStore } from '@/api/storage'
import JournalTab from '@/components/case/JournalTab'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

// helper wrapper that includes i18n provider
function wrap(ui: React.ReactElement) {
  // some components rely on role/snack context
  return render(
    <I18nextProvider i18n={i18n}>
      <RoleProvider>
        <SnackProvider>{ui}</SnackProvider>
      </RoleProvider>
    </I18nextProvider>,
  )
}

// we just need a minimal case object
const CASE_ID = 'case-1'
const MINIMAL_CASE = { id: CASE_ID } as any

beforeAll(() => {
  // always start from fresh seed for each test run
  initStore(structuredClone(SEED_STATE))
})

describe('JournalTab template selector', () => {
  it('renders button list when there are fewer than four templates and supports toggling', async () => {
    // Swedish seed state has two sv templates; default language is sv
    // remove any seeded draft so test logic is deterministic
    patchStore((s) => ({
      ...s,
      journalDrafts: s.journalDrafts.filter((d) => d.caseId !== CASE_ID),
    }))
    wrap(<JournalTab caseData={MINIMAL_CASE} />)

    // we expect two buttons with template names
    const firstBtn = await screen.findByRole('button', { name: /Standardjournal/i })
    const secondBtn = screen.getByRole('button', { name: /Avslutningsanteckning/i })
    expect(firstBtn).toBeInTheDocument()
    expect(secondBtn).toBeInTheDocument()

    // clicking selects and generates (draft should be added to store)
    await userEvent.click(firstBtn)
    const stdId = (await import('@/api/seed')).SEED_STATE.journalTemplates.find(
      (t) => t.name === 'Standardjournal',
    )!.id
    await waitFor(async () => {
      const store1 = (await import('@/api/storage')).getStore()
      expect(store1.journalDrafts.some((d) => d.templateId === stdId)).toBe(true)
    })

    // wait until the button is re-enabled before proceeding
    await waitFor(() => expect(firstBtn).not.toBeDisabled())

    // clicking again should unselect and remove the draft from store
    const secondClickBtn = await screen.findByRole('button', { name: /Standardjournal/i })
    await userEvent.click(secondClickBtn)
  })

  it('falls back to a Select when there are four or more templates and supports multiple selections', async () => {
    // ensure no pre-existing drafts for this case
    patchStore((s) => ({
      ...s,
      journalDrafts: s.journalDrafts.filter((d) => d.caseId !== CASE_ID),
    }))
    // add a couple of extra Swedish templates to exceed threshold
    patchStore((s) => ({
      ...s,
      journalTemplates: [
        ...s.journalTemplates,
        {
          id: 'extra-1',
          name: 'Extra one',
          language: 'sv',
          body: '',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'extra-2',
          name: 'Extra two',
          language: 'sv',
          body: '',
          createdAt: new Date().toISOString(),
        },
      ],
    }))

    wrap(<JournalTab caseData={MINIMAL_CASE} />)

    // a Select should appear instead of buttons
    expect(await screen.findByLabelText(/välj mall/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Standardjournal/i })).not.toBeInTheDocument()

    // open the dropdown and select two options
    const combo = await screen.findByRole('combobox')
    await userEvent.click(combo)
    const opt1 = await screen.findByRole('option', { name: /Extra one/i })
    const opt2 = await screen.findByRole('option', { name: /Extra two/i })
    await userEvent.click(opt1)
    await userEvent.click(opt2)

    // selections should generate drafts; verify via store
    await waitFor(async () => {
      const store3 = (await import('@/api/storage')).getStore()
      expect(store3.journalDrafts.some((d) => d.templateId === 'extra-1')).toBe(true)
      expect(store3.journalDrafts.some((d) => d.templateId === 'extra-2')).toBe(true)
    })

    // deselect one option by clicking again in the menu
    await userEvent.click(opt1)
    await waitFor(async () => {
      const store4 = (await import('@/api/storage')).getStore()
      expect(store4.journalDrafts.some((d) => d.templateId === 'extra-1')).toBe(false)
    })
  })
})
