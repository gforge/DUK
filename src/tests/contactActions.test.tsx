import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as client from '@/api/client'
import { SEED_STATE } from '@/api/seed'
import { initStore } from '@/api/storage'
import ContactActions from '@/components/case/ContactActions'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

// helper wrapper that includes i18n and context providers
function wrap(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <RoleProvider>
        <SnackProvider>{ui}</SnackProvider>
      </RoleProvider>
    </I18nextProvider>,
  )
}

const CASE_ID = SEED_STATE.cases[0].id
const MINIMAL_CASE = { id: CASE_ID, status: 'NEW', triggers: ['NOT_OPENED'] } as any

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
  vi.restoreAllMocks()
})

describe('ContactActions component', () => {
  it('is hidden for patients or closed cases or without trigger', () => {
    const noTrigger = { ...MINIMAL_CASE, triggers: [] }
    const closed = { ...MINIMAL_CASE, status: 'CLOSED' }

    wrap(<ContactActions caseData={noTrigger} onRefetch={() => {}} />)
    expect(screen.queryByRole('button', { name: /Contacted|Kontaktad/i })).not.toBeInTheDocument()

    wrap(<ContactActions caseData={closed} onRefetch={() => {}} />)
    expect(screen.queryByRole('button', { name: /Contacted|Kontaktad/i })).not.toBeInTheDocument()
  })

  it('shows panel for allowed roles and logs actions', async () => {
    // spy on client methods
    const logSpy = vi.spyOn(client, 'logContactEvent').mockResolvedValue()
    vi.spyOn(client, 'getAuditEvents').mockResolvedValue([])

    wrap(<ContactActions caseData={MINIMAL_CASE} onRefetch={() => {}} />)

    // should render all three buttons
    expect(await screen.findByRole('button', { name: /Contacted|Kontaktad/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Reminder sent|Påminnelse skickad/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Attempted call|Ringde – ej nådd/i }),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Reminder sent|Påminnelse skickad/i }))
    expect(logSpy).toHaveBeenCalledWith(
      CASE_ID,
      expect.any(String),
      expect.any(String),
      'REMINDER_SENT',
    )
  })

  it('displays last reminder and call attempt fetched from audit events', async () => {
    // create two events with different timestamps
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const twoDays = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const events = [
      {
        id: 'e1',
        caseId: CASE_ID,
        userId: 'u',
        userRole: 'NURSE' as const,
        action: 'REMINDER_SENT',
        timestamp: yesterday,
      },
      {
        id: 'e2',
        caseId: CASE_ID,
        userId: 'u',
        userRole: 'NURSE' as const,
        action: 'CALL_ATTEMPT',
        timestamp: twoDays,
      },
    ]
    vi.spyOn(client, 'getAuditEvents').mockResolvedValue(events)
    vi.spyOn(client, 'logContactEvent').mockResolvedValue()

    wrap(<ContactActions caseData={MINIMAL_CASE} onRefetch={() => {}} />)

    // first wait for the panel to appear
    expect(await screen.findByRole('button', { name: /Contacted|Kontaktad/i })).toBeInTheDocument()

    // suggestion text should mention a reminder date and include the word for "reminded"
    const suggestionEl = await screen.findByText(/påmind|reminded/i)
    expect(suggestionEl).toBeInTheDocument()
    // ensure grammar: since our mock date is "yesterday", the text should *not* contain " den "
    expect(suggestionEl.textContent).not.toMatch(/\bden\b/i)
    // both suggestion and the separate caption may contain the formatted date
    const dateMatches = await screen.findAllByText(/igår|yesterday/i)
    expect(dateMatches.length).toBeGreaterThanOrEqual(1)

    // call attempt line should appear (could be the button or the status text)
    const callMatches = screen.getAllByText(/Ringde – ej nådd|Attempted call/i)
    expect(callMatches.length).toBeGreaterThan(0)
  })

  it('uses contacted date in suggestion and hides buttons when contact event exists', async () => {
    const now = new Date().toISOString()
    const events = [
      {
        id: 'c1',
        caseId: CASE_ID,
        userId: 'u',
        userRole: 'NURSE' as const,
        action: 'CONTACTED',
        timestamp: now,
      },
    ]
    vi.spyOn(client, 'getAuditEvents').mockResolvedValue(events)
    vi.spyOn(client, 'logContactEvent').mockResolvedValue()

    wrap(<ContactActions caseData={MINIMAL_CASE} onRefetch={() => {}} />)

    // wait for the panel to render its suggestion text (ensures component mounted and events fetched)
    await screen.findByText(/patienten har inte öppnat formuläret/i)

    // suggestion now contains reminder wording with the contact timestamp
    const suggestionEl = screen.getByText(/påmind|reminded/i)
    expect(suggestionEl).toBeInTheDocument()
    expect(suggestionEl.textContent).not.toMatch(/\bden\b/i)

    // after a CONTACTED event there should be no action buttons at all
    expect(screen.queryByRole('button', { name: /Kontaktad|Contacted/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Påminnelse skickad|Reminder sent/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Ringde – ej nådd|Attempted call/i }),
    ).not.toBeInTheDocument()
  })

  it('re-shows buttons if last CONTACTED event is more than two days old', async () => {
    const twoDaysOld = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1000).toISOString()
    const events = [
      {
        id: 'c1',
        caseId: CASE_ID,
        userId: 'u',
        userRole: 'NURSE' as const,
        action: 'CONTACTED',
        timestamp: twoDaysOld,
      },
    ]
    vi.spyOn(client, 'getAuditEvents').mockResolvedValue(events)
    vi.spyOn(client, 'logContactEvent').mockResolvedValue()

    wrap(<ContactActions caseData={MINIMAL_CASE} onRefetch={() => {}} />)

    // panel should render and buttons should be available again
    expect(await screen.findByRole('button', { name: /Contacted|Kontaktad/i })).toBeInTheDocument()
  })
})
