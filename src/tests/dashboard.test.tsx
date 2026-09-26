import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { initStore } from '@/api/storage'
import Dashboard from '@/pages/Dashboard'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

function wrap(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <RoleProvider>
          <SnackProvider>{ui}</SnackProvider>
        </RoleProvider>
      </I18nextProvider>
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    initStore(structuredClone(SEED_STATE))
    localStorage.removeItem('dashboard.collapsedCategories')
  })

  it('renders one expanded table section per category by default', async () => {
    wrap(<Dashboard />)
    await screen.findByRole('radiogroup', { name: /Patientfilter/ })
    const tables = await screen.findAllByRole('table')
    expect(tables).toHaveLength(3)
    for (const table of tables) {
      expect(within(table).getByRole('columnheader', { name: 'Väntat' })).toBeInTheDocument()
    }
    expect(screen.getByText(/väntar på triage/)).toBeInTheDocument()
  })

  it('switches sort mode via the dropdown', async () => {
    wrap(<Dashboard />)
    const sortButton = await screen.findByRole('button', { name: 'Sortera efter' })
    expect(sortButton).toHaveTextContent('Längst väntan')
    await userEvent.click(sortButton)
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Namn' }))
    expect(sortButton).toHaveTextContent('Namn')
  })

  it('collapses a section, persists it and toggles all sections', async () => {
    const { unmount } = wrap(<Dashboard />)
    const acute = await screen.findByRole('button', { name: /^Akut/ })
    expect(acute).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(acute)
    expect(acute).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('table')).toHaveLength(2)

    unmount()
    wrap(<Dashboard />)
    expect(await screen.findByRole('button', { name: /^Akut/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Fäll ihop alla' }))
    expect(screen.queryAllByRole('table')).toHaveLength(0)
    await userEvent.click(screen.getByRole('button', { name: 'Fäll ut alla' }))
    expect(screen.getAllByRole('table')).toHaveLength(3)
  })
})
