import { render, screen, waitFor } from '@testing-library/react'
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

// helper that includes all context and wraps in a simple fragment
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

describe('Dashboard accordion persistence', () => {
  beforeEach(() => {
    // fresh state and clear stored preference
    initStore(structuredClone(SEED_STATE))
    localStorage.removeItem('dashboard.expandedCategories')
  })

  it('restores expanded category after unmount/mount', async () => {
    const { unmount } = wrap(<Dashboard />)

    // wait until the acute queue header is added to the DOM
    await screen.findByLabelText(/Patientfilter/)
    await waitFor(() => expect(document.getElementById('queue-ACUTE-header')).not.toBeNull())
    const acuteHeader = document.getElementById('queue-ACUTE-header') as HTMLElement
    expect(acuteHeader).toBeTruthy()
    expect(acuteHeader).toHaveAttribute('aria-expanded', 'false')

    // open it
    await acuteHeader.click()
    expect(acuteHeader).toHaveAttribute('aria-expanded', 'true')

    // unmount and remount
    unmount()
    wrap(<Dashboard />)

    // header should still be expanded on re-render
    await screen.findByLabelText(/Patientfilter/)
    await waitFor(() => expect(document.getElementById('queue-ACUTE-header')).not.toBeNull())
    const acuteHeader2 = document.getElementById('queue-ACUTE-header') as HTMLElement
    expect(acuteHeader2).toHaveAttribute('aria-expanded', 'true')

    // storage key should contain the category
    const raw = localStorage.getItem('dashboard.expandedCategories')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual(['ACUTE'])
  })
})
