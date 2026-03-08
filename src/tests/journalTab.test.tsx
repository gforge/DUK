import { render, screen } from '@testing-library/react'
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
  it('renders button list when there are fewer than four templates', async () => {
    // Swedish seed state has two sv templates; default language is sv
    wrap(<JournalTab caseData={MINIMAL_CASE} />)

    // we expect two buttons with template names
    expect(await screen.findByRole('button', { name: /Standardjournal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avslutningsanteckning/i })).toBeInTheDocument()

    // select state should update when clicking
    const button = screen.getByRole('button', { name: /Standardjournal/i })
    await userEvent.click(button)
    expect(button).toHaveClass('MuiButton-contained')

    // generate button should now be enabled
    const gen = screen.getByRole('button', { name: /generera/i })
    expect(gen).toBeEnabled()
  })

  it('falls back to a Select when there are four or more templates', async () => {
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

    // the select should contain the new options; open it by waiting for and clicking the combobox
    const combo = await screen.findByRole('combobox')
    await userEvent.click(combo)
    expect(await screen.findByRole('option', { name: /Extra one/i })).toBeInTheDocument()
  })
})
